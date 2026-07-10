package dev.oauthlint.engine

import com.intellij.execution.configurations.GeneralCommandLine
import com.intellij.execution.process.CapturingProcessHandler
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.application.PathManager
import com.intellij.openapi.components.service
import com.intellij.openapi.diagnostic.logger
import dev.oauthlint.settings.OAuthLintSettings
import java.io.IOException
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.StandardCopyOption
import java.security.MessageDigest
import java.util.Locale
import java.util.concurrent.locks.ReentrantLock
import kotlin.concurrent.withLock
import kotlin.io.path.exists
import kotlin.io.path.isExecutable
import kotlin.io.path.name

/**
 * The Opengrep release the plugin pins. Opengrep is a Python-free, single-file,
 * Semgrep-compatible engine; pinning the version keeps scans reproducible and
 * lets the cache key on the exact binary we verified. Identical to the pin used
 * by the OAuthLint VS Code extension.
 */
const val OPENGREP_VERSION: String = "1.25.0"

private const val RELEASE_BASE: String =
    "https://github.com/opengrep/opengrep/releases/download/v$OPENGREP_VERSION"

/**
 * A release asset for one platform, plus an optional musl fallback used only
 * when the default (glibc / manylinux) binary downloads but will not run.
 */
private data class AssetChoice(val primary: String, val fallback: String? = null)

/**
 * Maps a normalised `os/arch` key to the Opengrep release asset for that
 * platform. Mirrors the VS Code extension's ASSETS table.
 */
private val ASSETS: Map<String, AssetChoice> = mapOf(
    "darwin/arm64" to AssetChoice("opengrep_osx_arm64"),
    "darwin/x64" to AssetChoice("opengrep_osx_x86"),
    "linux/arm64" to AssetChoice("opengrep_manylinux_aarch64", "opengrep_musllinux_aarch64"),
    "linux/x64" to AssetChoice("opengrep_manylinux_x86", "opengrep_musllinux_x86"),
    "win32/x64" to AssetChoice("opengrep_windows_x86.exe"),
)

/**
 * SHA-256 of each pinned release asset, verified against the real v1.25.0
 * binaries. A downloaded file whose hash is not in this table, or does not
 * match, is rejected before it is ever made executable, so a tampered or
 * swapped release asset cannot be run. Regenerate when bumping OPENGREP_VERSION.
 */
private val CHECKSUMS: Map<String, String> = mapOf(
    "opengrep_osx_arm64" to "3543fcabae9db2ae5bc974a3b75426353f0a3e369181b2157ef27f46867996c8",
    "opengrep_osx_x86" to "fa2487b75527be1cc9ae4f9b0cb09a340454e7973c76785568285cbbcd977cb4",
    "opengrep_manylinux_aarch64" to "fd40124272d006082a5594b19aecee07b01dd50933d8add7a4fd5c557d2be5f6",
    "opengrep_manylinux_x86" to "9ac4aebb47ba3f7b0d8fc641ac8749cb6c2f253f616131a67d9631e00d4bea33",
    "opengrep_musllinux_aarch64" to "32836a4e86857522c5400c095b1451d6713aff946dd680da7971f0edc21d443a",
    "opengrep_musllinux_x86" to "83ac4d22cfb1a828ae0e48b88dbc3a78d97d53b5f7fafd37f83d0ed7e3b7d97c",
    "opengrep_windows_x86.exe" to "b010709bb790086083442eabe9a0b6bf48064ed87cdf808591baecdb60ccdf73",
)

/**
 * Thrown when the scan engine cannot be resolved: an unsupported platform, a
 * failed download, or a binary that will not run. The message is user-facing
 * and actionable; the annotator layer surfaces it (with a Retry action) and
 * never crashes over it.
 */
class EngineUnavailableException(detail: String) : Exception(detail)

/**
 * Resolves the Opengrep scan engine binary, downloading and caching it on first
 * use. A single lock guards against concurrent scans triggering parallel
 * downloads, and a successful resolution is memoised so later scans pay nothing.
 * [reset] clears the memo so a failed first run can be retried.
 *
 * Registered as an application-level service (see plugin.xml). Never call
 * [resolve] on the EDT: it may block on network + disk.
 */
class EngineManager {
    private val log = logger<EngineManager>()

    private val lock = ReentrantLock()

    @Volatile
    private var resolved: String? = null

    /** Cache root: <system>/oauthlint/opengrep/v1.25.0/ */
    private val versionDir: Path =
        Path.of(PathManager.getSystemPath(), "oauthlint", "opengrep", "v$OPENGREP_VERSION")

    private val binaryName: String =
        if (isWindows()) "opengrep.exe" else "opengrep"

    private val binaryPath: Path = versionDir.resolve(binaryName)

    /**
     * Resolve a usable engine binary path. Order: an explicit `enginePath`
     * setting, then the pinned cached binary, then an `opengrep` on PATH, then a
     * fresh download. Concurrent callers serialise on one resolution.
     *
     * @throws EngineUnavailableException if no engine can be obtained.
     */
    fun resolve(progress: (String) -> Unit = {}): String {
        resolved?.let { return it }
        lock.withLock {
            resolved?.let { return it }
            val path = doResolve(progress)
            resolved = path
            return path
        }
    }

    /** Forget a prior resolution so the next [resolve] re-runs (used by Retry). */
    fun reset() {
        resolved = null
    }

    private fun doResolve(progress: (String) -> Unit): String {
        // 1. Explicit user override — trust it, only check that it exists.
        val override = enginePathOverride()?.trim()
        if (!override.isNullOrEmpty()) {
            if (Path.of(override).exists()) return override
            throw EngineUnavailableException(
                "The configured OAuthLint engine path does not exist: $override. " +
                    "Point it at an installed opengrep or semgrep binary, or clear the setting " +
                    "to download the engine automatically.",
            )
        }

        // 2. Already-downloaded, version-matched cache.
        if (binaryPath.exists() && isPinnedVersion(binaryPath.toString())) {
            return binaryPath.toString()
        }

        // 3. An opengrep already on PATH (user-managed install).
        val onPath = whichOpengrep()
        if (onPath != null && runVersion(onPath) != null) return onPath

        // 4. Download the pinned binary for this platform.
        return downloadEngine(progress)
    }

    /** True when `binary --version` reports the pinned Opengrep version. */
    private fun isPinnedVersion(binary: String): Boolean = runVersion(binary) == OPENGREP_VERSION

    private fun downloadEngine(progress: (String) -> Unit): String {
        val key = platformKey()
        val choice = ASSETS[key]
            ?: throw EngineUnavailableException(
                "OAuthLint has no bundled scan engine for this platform ($key). " +
                    "Install opengrep or semgrep and set the OAuthLint engine path to its location.",
            )

        Files.createDirectories(versionDir)

        progress("Downloading the OAuthLint scan engine (~41 MB, one time)...")
        val assets = if (choice.fallback != null) listOf(choice.primary, choice.fallback) else listOf(choice.primary)
        var lastError = ""
        for (asset in assets) {
            try {
                fetchAndVerify(asset, progress)
                return binaryPath.toString()
            } catch (e: Exception) {
                lastError = e.message ?: e.toString()
                log.warn("OAuthLint: engine asset $asset failed: $lastError")
            }
        }
        throw EngineUnavailableException(
            "Could not download the OAuthLint scan engine for $key: $lastError. " +
                "Check your network connection and retry, or set the OAuthLint engine path " +
                "to an installed opengrep/semgrep binary.",
        )
    }

    /**
     * Download one asset into the cache, verify its SHA-256 against the pinned
     * value, make it executable, and confirm it runs the pinned version. The
     * checksum is checked before the file is made executable, so a tampered or
     * swapped binary is never run.
     */
    private fun fetchAndVerify(asset: String, progress: (String) -> Unit) {
        val expected = CHECKSUMS[asset]
            // Fail closed: only run binaries whose hash we pinned and verified.
            ?: throw IOException("no pinned checksum for $asset")

        val url = "$RELEASE_BASE/$asset"
        progress("Downloading the OAuthLint scan engine (~41 MB, one time)... ($asset)")
        download(url, binaryPath)

        val actual = sha256(binaryPath).lowercase(Locale.ROOT)
        if (actual != expected) {
            Files.deleteIfExists(binaryPath)
            throw IOException("checksum mismatch for $asset: expected $expected, got $actual")
        }
        makeExecutable(binaryPath)
        if (!isPinnedVersion(binaryPath.toString())) {
            throw IOException("downloaded engine did not report version $OPENGREP_VERSION")
        }
    }

    /**
     * Download [url] to [dest] over HTTPS, following redirects (GitHub release
     * assets 302 to a CDN). Writes to a temporary sibling first and moves it into
     * place atomically so a partial download never masquerades as a complete
     * binary.
     */
    private fun download(url: String, dest: Path) {
        val client = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build()
        val request = HttpRequest.newBuilder(URI.create(url)).GET().build()
        val tmp = dest.resolveSibling("${dest.name}.download")
        Files.deleteIfExists(tmp)
        try {
            val response = client.send(request, HttpResponse.BodyHandlers.ofFile(tmp))
            if (response.statusCode() != 200) {
                throw IOException("HTTP ${response.statusCode()} for $url")
            }
            Files.move(tmp, dest, StandardCopyOption.REPLACE_EXISTING)
        } finally {
            Files.deleteIfExists(tmp)
        }
    }

    private fun sha256(path: Path): String {
        val digest = MessageDigest.getInstance("SHA-256")
        Files.newInputStream(path).use { input ->
            val buffer = ByteArray(64 * 1024)
            while (true) {
                val read = input.read(buffer)
                if (read < 0) break
                digest.update(buffer, 0, read)
            }
        }
        return digest.digest().joinToString("") { "%02x".format(it) }
    }

    private fun makeExecutable(path: Path) {
        if (isWindows()) return
        val file = path.toFile()
        // setExecutable(true, false) => executable for all, mirroring chmod 0755's x bits.
        if (!file.setExecutable(true, false)) {
            file.setExecutable(true)
        }
    }

    /** Run `<binary> --version` and return its first trimmed line, or null on failure. */
    private fun runVersion(binary: String): String? {
        return try {
            val cmd = GeneralCommandLine(binary, "--version")
            val output = CapturingProcessHandler(cmd).runProcess(20_000)
            if (output.isTimeout || output.exitCode != 0) return null
            output.stdout.lineSequence().firstOrNull()?.trim()?.ifEmpty { null }
        } catch (e: Exception) {
            null
        }
    }

    /** Locate an `opengrep` executable on PATH, or null. */
    private fun whichOpengrep(): String? {
        val names = if (isWindows()) listOf("opengrep.exe", "opengrep") else listOf("opengrep")
        val pathEnv = System.getenv("PATH") ?: return null
        for (dir in pathEnv.split(java.io.File.pathSeparatorChar).filter { it.isNotEmpty() }) {
            for (name in names) {
                val candidate = Path.of(dir, name)
                if (candidate.exists() && (isWindows() || candidate.isExecutable())) {
                    return candidate.toString()
                }
            }
        }
        return null
    }

    private fun enginePathOverride(): String? =
        ApplicationManager.getApplication().service<OAuthLintSettings>().state.enginePath

    /** Normalise the JVM `os.name`/`os.arch` onto the VS Code `platform/arch` keys. */
    private fun platformKey(): String = "${osToken()}/${archToken()}"

    private fun osToken(): String {
        val os = System.getProperty("os.name").lowercase(Locale.ROOT)
        return when {
            os.contains("mac") || os.contains("darwin") -> "darwin"
            os.contains("win") -> "win32"
            else -> "linux"
        }
    }

    private fun archToken(): String {
        val arch = System.getProperty("os.arch").lowercase(Locale.ROOT)
        return when (arch) {
            "aarch64", "arm64" -> "arm64"
            "amd64", "x86_64", "x64" -> "x64"
            else -> arch
        }
    }

    private fun isWindows(): Boolean =
        System.getProperty("os.name").lowercase(Locale.ROOT).contains("win")
}
