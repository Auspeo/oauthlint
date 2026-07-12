package dev.oauthlint.scan

import com.intellij.execution.configurations.GeneralCommandLine
import com.intellij.execution.process.CapturingProcessHandler
import com.intellij.openapi.diagnostic.logger
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import java.nio.file.Path

/** OAuthLint's 5-level severity scale, ordered from least to most severe. */
enum class Severity {
    INFO, LOW, MEDIUM, HIGH, CRITICAL;

    companion object {
        /**
         * Map a raw Opengrep/Semgrep severity (INFO / WARNING / ERROR) onto the
         * OAuthLint scale. Mirrors SEMGREP_SEVERITY_MAP in the CLI; unknown values
         * default to MEDIUM.
         */
        fun fromRaw(raw: String?): Severity = when (raw?.uppercase()) {
            "INFO" -> INFO
            "WARNING" -> MEDIUM
            "ERROR" -> HIGH
            "LOW" -> LOW
            "MEDIUM" -> MEDIUM
            "HIGH" -> HIGH
            "CRITICAL" -> CRITICAL
            else -> MEDIUM
        }
    }
}

/**
 * A single normalised OAuthLint finding. Lines and columns are 1-based (as
 * Opengrep reports them); the annotator converts them to editor offsets.
 */
data class Finding(
    val ruleId: String,
    val message: String,
    val severity: Severity,
    val startLine: Int,
    val startCol: Int,
    val endLine: Int,
    val endCol: Int,
    val docUrl: String?,
)

/**
 * Runs the pinned Opengrep engine over a single file and parses its
 * Semgrep-compatible `--json` output into [Finding]s. Never spawns a shell
 * (uses [GeneralCommandLine] with discrete argv), and fails soft: a non-zero
 * exit, empty output, or unparseable JSON yields an empty list rather than an
 * exception, so a broken scan degrades gracefully instead of breaking the editor.
 */
class OpenGrepScanner(
    private val enginePath: String,
    private val rulesDir: Path,
) {
    private val log = logger<OpenGrepScanner>()

    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
    }

    /**
     * Scan [targetFile] and return the findings. [timeoutMs] bounds the
     * subprocess. Opengrep exits non-zero when findings are present, so a
     * non-zero exit is not treated as failure on its own; we parse whatever
     * JSON came back on stdout.
     */
    fun scan(targetFile: String, timeoutMs: Int = 30_000): List<Finding> {
        val cmd = GeneralCommandLine(
            enginePath,
            "scan",
            "--config", rulesDir.toString(),
            "--json",
            // Quiet keeps progress chatter off the streams; no-git-ignore ensures a
            // single explicitly named file is always scanned. NOTE: no --metrics
            // flag -- Opengrep does not support it (unlike the semgrep CLI path).
            "--quiet",
            "--no-git-ignore",
            // `--` terminates option parsing so a path starting with `-` is never
            // mistaken for a flag. Targets are discrete argv entries, never a shell
            // string, so there is no injection surface.
            "--",
            targetFile,
        )
        // Opengrep bundles Python, which reads the (UTF-8) rule files using the
        // process locale. An IDE launched without a UTF-8 locale would make Python
        // fall back to ASCII and die on a non-ASCII byte in a rule, scanning zero
        // files. Force UTF-8 for the subprocess so scans work regardless.
        cmd.withEnvironment(
            mapOf("LANG" to "C.UTF-8", "LC_ALL" to "C.UTF-8", "PYTHONUTF8" to "1"),
        )

        val output = try {
            CapturingProcessHandler(cmd).runProcess(timeoutMs)
        } catch (e: Exception) {
            log.warn("OAuthLint: scan process failed to run: ${e.message}")
            return emptyList()
        }

        if (output.isTimeout) {
            log.warn("OAuthLint: scan timed out after ${timeoutMs}ms for $targetFile")
            return emptyList()
        }

        val stdout = output.stdout.trim()
        if (stdout.isEmpty()) return emptyList()

        val parsed = try {
            json.decodeFromString(SemgrepJson.serializer(), stdout)
        } catch (e: Exception) {
            log.warn("OAuthLint: could not parse scan output: ${e.message}")
            return emptyList()
        }

        return parsed.results.map { it.toFinding() }
    }
}

// --- Opengrep / Semgrep --json wire model (only the fields we read) ----------

@Serializable
private data class SemgrepJson(
    val results: List<SemgrepResult> = emptyList(),
)

@Serializable
private data class SemgrepResult(
    @SerialName("check_id") val checkId: String,
    val path: String = "",
    val start: SemgrepPos = SemgrepPos(),
    val end: SemgrepPos = SemgrepPos(),
    val extra: SemgrepExtra = SemgrepExtra(),
) {
    fun toFinding(): Finding = Finding(
        ruleId = normaliseRuleId(checkId),
        message = (extra.message ?: "").trim(),
        severity = Severity.fromRaw(extra.severity),
        startLine = start.line,
        startCol = start.col,
        endLine = end.line,
        endCol = end.col,
        docUrl = extra.metadata?.docUrl,
    )
}

@Serializable
private data class SemgrepPos(
    val line: Int = 1,
    val col: Int = 1,
)

@Serializable
private data class SemgrepExtra(
    val severity: String? = null,
    val message: String? = null,
    val metadata: SemgrepMetadata? = null,
)

@Serializable
private data class SemgrepMetadata(
    @SerialName("oauthlint-rule-id") val oauthlintRuleId: String? = null,
    @SerialName("oauthlint-doc-url") val docUrl: String? = null,
    val cwe: String? = null,
)

/**
 * Strip the file-path prefix Opengrep encodes into `check_id` when loading rules
 * from a directory, recovering the canonical `auth.<category>.<name>` (or
 * `auth.<lang>.<category>.<name>`) id. Anchored at the END so a path that
 * contains `auth.` more than once is not truncated. Custom ids that do not fit
 * the shape are returned unchanged. Mirrors normaliseRuleId in the CLI.
 */
private val OAUTHLINT_ID_RE =
    Regex("(?<![a-z])auth\\.(?:[a-z][a-z0-9]*\\.)?[a-z][a-z0-9-]*\\.[a-z][a-z0-9-]*$")

internal fun normaliseRuleId(rawId: String): String =
    OAUTHLINT_ID_RE.find(rawId)?.value ?: rawId
