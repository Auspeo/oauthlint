package dev.oauthlint.rules

import com.intellij.openapi.application.PathManager
import com.intellij.openapi.diagnostic.logger
import java.io.IOException
import java.nio.file.Files
import java.nio.file.Path
import java.util.concurrent.locks.ReentrantLock
import kotlin.concurrent.withLock
import kotlin.io.path.exists
import kotlin.io.path.readText

/**
 * Root (inside the plugin jar) under which the OAuthLint rule pack is bundled by
 * the `bundleRules` Gradle task. `index.txt` is a newline-separated list of every
 * rule file relative to this root; `VERSION` keys the extraction cache.
 */
private const val BUNDLE_ROOT = "oauthlint-rules"

/**
 * Extracts the bundled OAuthLint YAML rule pack out of the plugin jar to a
 * versioned cache directory on disk once, and returns that directory for the
 * engine's `--config`. Opengrep needs a real directory tree, so we materialise
 * the pack rather than pointing it at classpath entries.
 *
 * Registered as an application-level service (see plugin.xml).
 */
class RuleBundle {
    private val log = logger<RuleBundle>()
    private val lock = ReentrantLock()

    @Volatile
    private var resolvedDir: Path? = null

    /**
     * Resolve the on-disk rules directory to pass to `--config`, extracting the
     * bundled pack on first use. Idempotent and thread-safe.
     *
     * @throws IOException if the bundled pack cannot be read or written.
     */
    fun resolveConfigDir(): Path {
        resolvedDir?.let { return it }
        return lock.withLock {
            resolvedDir?.let { return it }
            val dir = extract()
            resolvedDir = dir
            dir
        }
    }

    private fun extract(): Path {
        val version = readResource("$BUNDLE_ROOT/VERSION")?.trim()?.ifEmpty { null }
            ?: throw IOException("OAuthLint rule pack VERSION marker is missing from the plugin jar")
        val index = readResource("$BUNDLE_ROOT/index.txt")
            ?: throw IOException("OAuthLint rule pack index.txt is missing from the plugin jar")

        val cacheDir = Path.of(PathManager.getSystemPath(), "oauthlint", "rules", version)
        val marker = cacheDir.resolve(".extracted")

        // Fast path: a complete prior extraction for this exact version.
        if (marker.exists()) return cacheDir

        val relPaths = index.lineSequence()
            .map { it.trim() }
            .filter { it.isNotEmpty() }
            .toList()

        for (rel in relPaths) {
            // Guard against path traversal from a malformed index.
            require(!rel.startsWith("/") && !rel.contains("..")) { "unsafe rule path in index: $rel" }
            val target = cacheDir.resolve(rel)
            Files.createDirectories(target.parent)
            val bytes = readResourceBytes("$BUNDLE_ROOT/$rel")
                ?: throw IOException("OAuthLint rule file missing from plugin jar: $rel")
            Files.write(target, bytes)
        }

        Files.write(marker, version.toByteArray())
        log.info("OAuthLint: extracted ${relPaths.size} rule files to $cacheDir")
        return cacheDir
    }

    private fun readResource(path: String): String? =
        readResourceBytes(path)?.toString(Charsets.UTF_8)

    private fun readResourceBytes(path: String): ByteArray? {
        // Load from this plugin's classloader; the leading slash is stripped for
        // getResourceAsStream on the class's own loader.
        val loader = javaClass.classLoader
        return loader.getResourceAsStream(path)?.use { it.readBytes() }
    }
}
