package dev.oauthlint.annotator

import com.intellij.lang.annotation.AnnotationHolder
import com.intellij.lang.annotation.ExternalAnnotator
import com.intellij.lang.annotation.HighlightSeverity
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.components.service
import com.intellij.openapi.diagnostic.logger
import com.intellij.openapi.editor.Document
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.util.TextRange
import com.intellij.psi.PsiDocumentManager
import com.intellij.psi.PsiFile
import dev.oauthlint.engine.EngineManager
import dev.oauthlint.engine.EngineUnavailableException
import dev.oauthlint.notify.EngineNotifications
import dev.oauthlint.rules.RuleBundle
import dev.oauthlint.scan.Finding
import dev.oauthlint.scan.OpenGrepScanner
import dev.oauthlint.scan.Severity
import com.intellij.openapi.project.Project

/**
 * What [collectInformation] captures on the EDT for the (off-EDT) scan: the file
 * path to scan plus a snapshot of the enabled/severity settings so the scan does
 * not read live settings from a background thread.
 */
data class CollectedInfo(
    val project: Project,
    val filePath: String,
    val minSeverity: Severity,
)

/**
 * Language-agnostic OAuthLint annotator. It scans the file on disk with the
 * pinned Opengrep engine and renders each finding as a native IDE annotation
 * (inline highlight + gutter + tooltip). Registered per language via the optional
 * config files so it only activates where that language's plugin is present.
 *
 * The three phases run on the phases the platform guarantees:
 *  - [collectInformation]: EDT, cheap snapshot only.
 *  - [doAnnotate]: background thread, the actual scan (may download the engine).
 *  - [apply]: EDT, creates annotations from the results.
 */
class OAuthLintExternalAnnotator : ExternalAnnotator<CollectedInfo, List<Finding>>() {

    private val log = logger<OAuthLintExternalAnnotator>()

    override fun collectInformation(file: PsiFile, editor: Editor, hasErrors: Boolean): CollectedInfo? {
        val settings = dev.oauthlint.settings.OAuthLintSettings.getInstance().state
        if (!settings.enabled) return null
        val path = file.virtualFile?.path ?: return null
        val minSeverity = parseSeverity(settings.minSeverity)
        return CollectedInfo(file.project, path, minSeverity)
    }

    override fun doAnnotate(collectedInfo: CollectedInfo): List<Finding> {
        val app = ApplicationManager.getApplication()
        return try {
            val engine = app.service<EngineManager>().resolve()
            val rulesDir = app.service<RuleBundle>().resolveConfigDir()
            val findings = OpenGrepScanner(engine, rulesDir).scan(collectedInfo.filePath)
            EngineNotifications.resetWarning()
            findings.filter { it.severity.ordinal >= collectedInfo.minSeverity.ordinal }
        } catch (e: EngineUnavailableException) {
            log.warn("OAuthLint: engine unavailable: ${e.message}")
            val project = collectedInfo.project
            app.invokeLater {
                EngineNotifications.engineUnavailable(project, e.message ?: "The scan engine could not be started.") {
                    app.service<EngineManager>().reset()
                    if (!project.isDisposed) {
                        com.intellij.codeInsight.daemon.DaemonCodeAnalyzer.getInstance(project).restart()
                    }
                }
            }
            emptyList()
        } catch (e: Exception) {
            log.warn("OAuthLint: scan failed: ${e.message}")
            emptyList()
        }
    }

    override fun apply(file: PsiFile, annotationResult: List<Finding>, holder: AnnotationHolder) {
        if (annotationResult.isEmpty()) return
        val document = PsiDocumentManager.getInstance(file.project).getDocument(file) ?: return

        for (finding in annotationResult) {
            val range = toTextRange(document, finding) ?: continue
            val severity = toHighlightSeverity(finding.severity)
            val summary = finding.message.lineSequence().firstOrNull()?.trim().takeUnless { it.isNullOrEmpty() }
                ?: finding.ruleId
            holder.newAnnotation(severity, "$summary (${finding.ruleId})")
                .range(range)
                .tooltip(buildTooltip(finding))
                .create()
        }
    }

    /** Map OAuthLint severity onto IntelliJ highlight severities. */
    private fun toHighlightSeverity(severity: Severity): HighlightSeverity = when (severity) {
        Severity.CRITICAL, Severity.HIGH -> HighlightSeverity.ERROR
        Severity.MEDIUM -> HighlightSeverity.WARNING
        Severity.LOW, Severity.INFO -> HighlightSeverity.WEAK_WARNING
    }

    /**
     * Convert a finding's 1-based line/column span to a document [TextRange],
     * clamped to the document. Opengrep's end column points just past the last
     * matched character; if the span collapses we fall back to the start line's
     * end so the highlight is always visible.
     */
    private fun toTextRange(document: Document, finding: Finding): TextRange? {
        if (document.lineCount == 0) return null
        val start = lineColToOffset(document, finding.startLine, finding.startCol)
        var end = lineColToOffset(document, finding.endLine, finding.endCol)
        if (end <= start) {
            val lineIdx = (finding.startLine - 1).coerceIn(0, document.lineCount - 1)
            end = document.getLineEndOffset(lineIdx)
        }
        if (end <= start) return null
        return TextRange(start, end)
    }

    private fun lineColToOffset(document: Document, line: Int, col: Int): Int {
        val lineIdx = (line - 1).coerceIn(0, document.lineCount - 1)
        val lineStart = document.getLineStartOffset(lineIdx)
        val lineEnd = document.getLineEndOffset(lineIdx)
        return (lineStart + (col - 1)).coerceIn(lineStart, lineEnd)
    }

    /** HTML tooltip: rule id, full message, and a docs link when present. */
    private fun buildTooltip(finding: Finding): String {
        val sb = StringBuilder()
        sb.append("<html><body>")
        sb.append("<b>").append(escape(finding.ruleId)).append("</b>")
        sb.append("<br/>")
        sb.append(escape(finding.message).replace("\n", "<br/>"))
        val url = finding.docUrl
            ?: "https://oauthlint.dev/rules/${finding.ruleId.removePrefix("auth.")}"
        sb.append("<br/><br/>")
        sb.append("<a href=\"").append(escape(url)).append("\">OAuthLint documentation</a>")
        sb.append("</body></html>")
        return sb.toString()
    }

    private fun escape(s: String): String = s
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\"", "&quot;")

    private fun parseSeverity(raw: String): Severity =
        runCatching { Severity.valueOf(raw.uppercase()) }.getOrDefault(Severity.MEDIUM)
}
