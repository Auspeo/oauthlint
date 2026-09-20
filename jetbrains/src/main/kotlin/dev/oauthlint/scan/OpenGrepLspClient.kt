package dev.oauthlint.scan

import com.intellij.execution.configurations.GeneralCommandLine
import com.intellij.openapi.Disposable
import com.intellij.openapi.components.Service
import com.intellij.openapi.diagnostic.logger
import com.intellij.util.concurrency.AppExecutorUtil
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.add
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.int
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.put
import java.io.InputStream
import java.io.OutputStream
import java.nio.charset.StandardCharsets
import java.nio.file.Path
import java.util.concurrent.CompletableFuture
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicInteger

/**
 * Resident Opengrep LSP scan backend, ported from the VS Code sibling
 * (vscode/src/lspEngine.ts). The CLI ([OpenGrepScanner]) re-spawns the engine per
 * scan, which pays the ~4s rule-pack compilation every keystroke. For live,
 * as-you-type linting we instead keep ONE `opengrep lsp` process alive: it
 * compiles the 281-rule pack once, then scans the in-memory buffer on each edit in
 * ~10-20ms. This service owns that process for the life of the project and exposes
 * a single blocking [scan] call.
 *
 * Protocol (verified against Opengrep 1.25 `opengrep lsp`):
 *  - `initialize` with `initializationOptions.scan.configuration = [rulesRoot]`
 *    and `onlyGitDirty=false`, then `initialized`.
 *  - the pack is ready when the server sends the `semgrep/rulesRefreshed`
 *    notification (a fallback timer covers the rare case it never arrives);
 *    scans are withheld until then.
 *  - a document is scanned by `textDocument/didOpen` the first time, and
 *    thereafter by a `textDocument/didChange` (to keep the server's model in
 *    sync) followed by a `textDocument/didSave` carrying the current text (the
 *    save is what actually triggers a re-scan; `didChange` alone does not, the
 *    server uses incremental sync).
 *  - results arrive as a `textDocument/publishDiagnostics` notification whose
 *    `code` is the OAuthLint rule id.
 *
 * Registered as a project-level service via [Service]; disposed on project close
 * (see [dispose]), which tears the process down and unblocks any pending scan.
 * Never call [scan] on the EDT: it blocks on the child process.
 */
@Service(Service.Level.PROJECT)
class OpenGrepLspClient : Disposable {

    private val log = logger<OpenGrepLspClient>()

    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
    }

    /** Per-scan timeout: how long we wait for the publishDiagnostics reply. */
    private val scanTimeoutMs: Long = 5_000

    /** Readiness fallback: how long we wait for the pack to compile before giving up. */
    private val readyTimeoutMs: Long = 30_000

    // --- process + protocol state ---------------------------------------------

    private val lifecycleLock = Any()

    @Volatile
    private var process: Process? = null

    @Volatile
    private var writer: OutputStream? = null

    /** True once the process has exited or failed to start; scans then fall back. */
    @Volatile
    private var crashed = false

    @Volatile
    private var disposed = false

    private val nextId = AtomicInteger(1)

    /**
     * Completes true when the rule pack is compiled (via `semgrep/rulesRefreshed`
     * or the readiness fallback), or false if the process exits first. A scan
     * waits on this before dispatching, so results are never withheld silently.
     */
    private val readyFuture = CompletableFuture<Boolean>()

    /** Documents already opened on the server, so subsequent scans use didChange. */
    private val opened = ConcurrentHashMap.newKeySet<String>()

    /** In-flight scans keyed by uri; the next publishDiagnostics for the uri resolves it. */
    private val pending = ConcurrentHashMap<String, CompletableFuture<List<LspDiagnostic>>>()

    /**
     * Scan the given in-memory buffer through the resident LSP process and return
     * its findings, or `null` when the LSP backend is unavailable (never started,
     * crashed, not ready in time, or timed out) so the caller can fall back to the
     * CLI. An empty list is a real result (scanned, no findings) and must NOT be
     * treated as a fallback trigger.
     *
     * [binary] and [rulesRoot] configure the process on first use; once started
     * they are fixed for the life of the service (later values are ignored). All
     * arguments are captured off the EDT by the caller.
     *
     * @param uri absolute `file://` uri of the document being scanned.
     * @param languageId the LSP language id (VS Code style, e.g. `typescript`).
     * @param text the current, in-memory document text.
     * @param timeoutMs bound on the whole call, including readiness on first use.
     */
    fun scan(
        binary: String,
        rulesRoot: Path,
        rootUri: String,
        uri: String,
        languageId: String,
        text: String,
        timeoutMs: Long = scanTimeoutMs,
    ): List<Finding>? {
        if (!ensureStarted(binary, rulesRoot, rootUri)) return null
        if (crashed) return null

        // Withhold the scan until the pack has compiled. The first scan pays the
        // one-time compilation wait (same cost as a single CLI scan); every scan
        // after that returns immediately because the future is already complete.
        val ready = try {
            readyFuture.get(readyTimeoutMs, TimeUnit.MILLISECONDS)
        } catch (e: Exception) {
            log.warn("OAuthLint: LSP engine not ready: ${e.message}")
            return null
        }
        if (!ready || crashed) return null

        // Register the pending result BEFORE dispatching so the publishDiagnostics
        // notification can never arrive before we are listening. A newer scan for
        // the same uri supersedes an older in-flight one (which resolves empty), so
        // only the latest keystroke's result is delivered.
        val future = CompletableFuture<List<LspDiagnostic>>()
        pending.put(uri, future)?.complete(emptyList())

        try {
            dispatch(uri, languageId, text)
        } catch (e: Exception) {
            pending.remove(uri, future)
            log.warn("OAuthLint: LSP scan dispatch failed: ${e.message}")
            return null
        }

        val diagnostics = try {
            future.get(timeoutMs, TimeUnit.MILLISECONDS)
        } catch (e: Exception) {
            pending.remove(uri, future)
            log.warn("OAuthLint: LSP scan timed out for $uri")
            return null
        }

        return diagnostics.mapNotNull { it.toFinding(uri) }
    }

    // --- lifecycle ------------------------------------------------------------

    /**
     * Start the `opengrep lsp` process once, launch its reader/stderr threads, and
     * send `initialize`. Idempotent and thread-safe. Returns false (and marks the
     * client crashed) if the process cannot be spawned, so the caller falls back.
     */
    private fun ensureStarted(binary: String, rulesRoot: Path, rootUri: String): Boolean {
        process?.let { return !crashed }
        if (disposed) return false
        synchronized(lifecycleLock) {
            process?.let { return !crashed }
            if (disposed || crashed) return false
            return try {
                val cmd = GeneralCommandLine(binary, "lsp")
                // Opengrep bundles Python, which reads the (UTF-8) rule files using
                // the process locale. An IDE launched without a UTF-8 locale would
                // make Python fall back to ASCII and die on a non-ASCII byte in a
                // rule. Force UTF-8 so the resident engine works regardless.
                cmd.withEnvironment(
                    mapOf("PYTHONUTF8" to "1", "LANG" to "C.UTF-8", "LC_ALL" to "C.UTF-8"),
                )
                val proc = cmd.createProcess()
                process = proc
                writer = proc.outputStream

                startReaderThread(proc.inputStream)
                startStderrDrainThread(proc.errorStream)
                proc.onExit().thenRun { onExit() }

                // Fallback readiness in case `semgrep/rulesRefreshed` never arrives,
                // so the LSP path is still used rather than timing out every scan.
                AppExecutorUtil.getAppScheduledExecutorService().schedule(
                    { markReady() }, readyTimeoutMs, TimeUnit.MILLISECONDS,
                )

                sendInitialize(rulesRoot, rootUri)
                log.info("OAuthLint: started resident opengrep lsp process")
                true
            } catch (e: Exception) {
                crashed = true
                log.warn("OAuthLint: could not start opengrep lsp: ${e.message}")
                readyFuture.complete(false)
                false
            }
        }
    }

    /** Drain stdout, framing LSP messages, until the stream ends. */
    private fun startReaderThread(input: InputStream) {
        val thread = Thread({ readLoop(input) }, "OAuthLint-LSP-reader")
        thread.isDaemon = true
        thread.start()
    }

    /**
     * The stderr pipe must be drained or the child can block once it fills; we
     * only log at debug since Opengrep's stderr is progress chatter, not results.
     */
    private fun startStderrDrainThread(err: InputStream) {
        val thread = Thread({
            try {
                err.use { it.readBytes() }
            } catch (_: Exception) {
                // Process gone; nothing to drain.
            }
        }, "OAuthLint-LSP-stderr")
        thread.isDaemon = true
        thread.start()
    }

    private fun readLoop(input: InputStream) {
        var buf = ByteArray(0)
        val chunk = ByteArray(64 * 1024)
        try {
            while (true) {
                val read = input.read(chunk)
                if (read < 0) break
                buf += chunk.copyOf(read)
                buf = drainFrames(buf)
            }
        } catch (_: Exception) {
            // Process crashed or was killed; onExit() handles cleanup.
        } finally {
            onExit()
        }
    }

    /**
     * Consume every complete `Content-Length` framed message at the front of [buf]
     * and return the unconsumed remainder. Mirrors the framing in lspEngine.ts.
     */
    private fun drainFrames(buf: ByteArray): ByteArray {
        var rest = buf
        while (true) {
            val headerEnd = indexOfCrlfCrlf(rest)
            if (headerEnd < 0) break
            val header = String(rest, 0, headerEnd, StandardCharsets.US_ASCII)
            val length = CONTENT_LENGTH_RE.find(header)?.groupValues?.get(1)?.toIntOrNull()
            if (length == null) {
                // Malformed header: drop it and resync past the separator.
                rest = rest.copyOfRange(headerEnd + 4, rest.size)
                continue
            }
            val bodyStart = headerEnd + 4
            if (rest.size < bodyStart + length) break // wait for more bytes
            val body = String(rest, bodyStart, length, StandardCharsets.UTF_8)
            rest = rest.copyOfRange(bodyStart + length, rest.size)
            handleMessage(body)
        }
        return rest
    }

    private fun handleMessage(body: String) {
        val msg = try {
            json.parseToJsonElement(body).jsonObject
        } catch (e: Exception) {
            return
        }

        // initialize response (id == 1 with a result) -> acknowledge with initialized.
        val id = (msg["id"] as? JsonPrimitive)?.intOrNull
        if (id == 1 && msg["result"] is JsonObject) {
            send(buildJsonObject {
                put("jsonrpc", "2.0")
                put("method", "initialized")
                put("params", buildJsonObject { })
            })
            return
        }

        when ((msg["method"] as? JsonPrimitive)?.contentOrNullSafe()) {
            "semgrep/rulesRefreshed" -> markReady()
            "textDocument/publishDiagnostics" -> handlePublishDiagnostics(msg["params"] as? JsonObject)
        }
    }

    private fun handlePublishDiagnostics(params: JsonObject?) {
        if (params == null) return
        val uri = (params["uri"] as? JsonPrimitive)?.contentOrNullSafe() ?: return
        val future = pending.remove(uri) ?: return
        val diagnostics = (params["diagnostics"] as? JsonArray).orEmptyDiagnostics()
        future.complete(diagnostics)
    }

    private fun markReady() {
        readyFuture.complete(true)
    }

    /** Terminate everything: mark crashed, resolve pending empty, unblock waiters. */
    private fun onExit() {
        if (crashed && process == null) return
        crashed = true
        readyFuture.complete(false)
        val drained = ArrayList(pending.values)
        pending.clear()
        opened.clear()
        for (f in drained) f.complete(emptyList())
        val proc = process
        process = null
        writer = null
        if (proc != null && proc.isAlive) {
            proc.destroy()
        }
    }

    override fun dispose() {
        disposed = true
        onExit()
    }

    // --- outgoing messages ----------------------------------------------------

    private fun sendInitialize(rulesRoot: Path, rootUri: String) {
        send(buildJsonObject {
            put("jsonrpc", "2.0")
            put("id", nextId.getAndIncrement())
            put("method", "initialize")
            put("params", buildJsonObject {
                put("processId", ProcessHandle.current().pid().toInt())
                put("rootUri", rootUri)
                put("workspaceFolders", buildJsonArray {
                    add(buildJsonObject {
                        put("uri", rootUri)
                        put("name", "oauthlint")
                    })
                })
                put("capabilities", buildJsonObject {
                    put("textDocument", buildJsonObject {
                        put("publishDiagnostics", buildJsonObject { })
                    })
                })
                put("initializationOptions", buildJsonObject {
                    put("scan", buildJsonObject {
                        put("configuration", buildJsonArray { add(rulesRoot.toString()) })
                        put("onlyGitDirty", false)
                    })
                })
            })
        })
    }

    /**
     * Send the scan-trigger sequence for [uri]. First time: `didOpen`. Thereafter:
     * `didChange` (keeps the server's model in sync) then `didSave` carrying the
     * current text (the save is the actual re-scan trigger; the server uses
     * incremental sync, so `didChange` alone does not re-scan).
     */
    private fun dispatch(uri: String, languageId: String, text: String) {
        if (opened.add(uri)) {
            send(buildJsonObject {
                put("jsonrpc", "2.0")
                put("method", "textDocument/didOpen")
                put("params", buildJsonObject {
                    put("textDocument", buildJsonObject {
                        put("uri", uri)
                        put("languageId", languageId)
                        put("version", 1)
                        put("text", text)
                    })
                })
            })
        } else {
            send(buildJsonObject {
                put("jsonrpc", "2.0")
                put("method", "textDocument/didChange")
                put("params", buildJsonObject {
                    put("textDocument", buildJsonObject {
                        put("uri", uri)
                        put("version", nextId.getAndIncrement())
                    })
                    put("contentChanges", buildJsonArray {
                        add(buildJsonObject { put("text", text) })
                    })
                })
            })
            send(buildJsonObject {
                put("jsonrpc", "2.0")
                put("method", "textDocument/didSave")
                put("params", buildJsonObject {
                    put("textDocument", buildJsonObject { put("uri", uri) })
                    put("text", text)
                })
            })
        }
    }

    /** Frame one JSON message as `Content-Length: N\r\n\r\n<body>` and write it. */
    @Synchronized
    private fun send(message: JsonObject) {
        val out = writer ?: return
        val body = json.encodeToString(JsonObject.serializer(), message).toByteArray(StandardCharsets.UTF_8)
        val header = "Content-Length: ${body.size}\r\n\r\n".toByteArray(StandardCharsets.US_ASCII)
        try {
            out.write(header)
            out.write(body)
            out.flush()
        } catch (e: Exception) {
            log.warn("OAuthLint: LSP write failed: ${e.message}")
            onExit()
        }
    }

    // --- diagnostic mapping ---------------------------------------------------

    /**
     * Project one live LSP diagnostic onto a [Finding], mirroring
     * lspDiagnosticToFinding in the VS Code extension. LSP ranges are 0-based; the
     * annotator expects 1-based line/column. The `code` is the OAuthLint rule id;
     * the doc URL is derived from it. Live diagnostics carry no autofix payload, so
     * [Finding.fix] stays null (the "Apply fix" action is offered on CLI scans).
     */
    private fun LspDiagnostic.toFinding(uri: String): Finding? {
        val ruleId = normaliseRuleId(code ?: return null)
        return Finding(
            ruleId = ruleId,
            message = message.trim(),
            severity = severityFromLsp(severity),
            startLine = startLine + 1,
            startCol = startCol + 1,
            endLine = endLine + 1,
            endCol = endCol + 1,
            docUrl = "https://oauthlint.dev/rules/${ruleId.removePrefix("auth.")}",
            filePath = uri,
        )
    }

    private fun JsonPrimitive.contentOrNullSafe(): String? = if (isString) content else null

    private fun JsonArray?.orEmptyDiagnostics(): List<LspDiagnostic> {
        if (this == null) return emptyList()
        return this.mapNotNull { element ->
            val obj = element as? JsonObject ?: return@mapNotNull null
            val range = obj["range"]?.jsonObject ?: return@mapNotNull null
            val start = range["start"]?.jsonObject ?: return@mapNotNull null
            val end = range["end"]?.jsonObject ?: return@mapNotNull null
            LspDiagnostic(
                code = (obj["code"] as? JsonPrimitive)?.let { if (it.isString) it.content else it.intOrNull?.toString() },
                message = (obj["message"] as? JsonPrimitive)?.content ?: "",
                severity = (obj["severity"] as? JsonPrimitive)?.intOrNull,
                startLine = (start["line"] as? JsonPrimitive)?.int ?: 0,
                startCol = (start["character"] as? JsonPrimitive)?.int ?: 0,
                endLine = (end["line"] as? JsonPrimitive)?.int ?: 0,
                endCol = (end["character"] as? JsonPrimitive)?.int ?: 0,
            )
        }
    }

    companion object {
        private val CONTENT_LENGTH_RE = Regex("Content-Length:\\s*(\\d+)", RegexOption.IGNORE_CASE)

        /**
         * Map an LSP diagnostic severity (1 Error, 2 Warning, 3 Info, 4 Hint) onto
         * the OAuthLint scale the same way the CLI does (Error -> HIGH, Warning ->
         * MEDIUM, Info/Hint -> INFO). Mirrors LSP_SEVERITY_TO_TIER in the VS Code
         * extension; a missing/unknown severity defaults to MEDIUM.
         */
        private fun severityFromLsp(severity: Int?): Severity = when (severity) {
            1 -> Severity.HIGH
            2 -> Severity.MEDIUM
            3, 4 -> Severity.INFO
            else -> Severity.MEDIUM
        }

        /** Index of the first `\r\n\r\n` separator in [buf], or -1 if absent. */
        private fun indexOfCrlfCrlf(buf: ByteArray): Int {
            var i = 0
            while (i + 3 < buf.size) {
                if (buf[i] == CR && buf[i + 1] == LF && buf[i + 2] == CR && buf[i + 3] == LF) return i
                i++
            }
            return -1
        }

        private const val CR: Byte = '\r'.code.toByte()
        private const val LF: Byte = '\n'.code.toByte()
    }
}

/**
 * A live LSP diagnostic as Opengrep emits it (only the fields we consume).
 * Line/column are 0-based, exactly as they arrive on the wire; the mapping to a
 * 1-based [Finding] happens in [OpenGrepLspClient].
 */
data class LspDiagnostic(
    val code: String?,
    val message: String,
    val severity: Int?,
    val startLine: Int,
    val startCol: Int,
    val endLine: Int,
    val endCol: Int,
)
