package dev.oauthlint.quickfix

import com.intellij.codeInsight.intention.IntentionAction
import com.intellij.ide.BrowserUtil
import com.intellij.lang.LanguageCommenters
import com.intellij.openapi.editor.Document
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.project.Project
import com.intellij.openapi.util.TextRange
import com.intellij.psi.PsiFile
import dev.oauthlint.scan.Finding
import dev.oauthlint.scan.FixRange

/**
 * Alt+Enter quick fixes for an OAuthLint finding, mirroring the VS Code
 * extension's code actions (see `vscode/src/extension.ts`
 * `OAuthLintCodeActionProvider`): "Apply fix" (when the finding ships one),
 * "Suppress on this line", and "Open documentation". Each is an
 * [IntentionAction] so it can be attached to the annotation via
 * `AnnotationBuilder.withFix(...)`.
 *
 * The finding's coordinates are captured when the annotation is built; the edit
 * is re-resolved against the live document at invocation time so an intervening
 * edit never applies the change at a stale offset (the platform re-highlights,
 * dropping fixes that no longer apply, but we clamp defensively regardless).
 */
object OAuthLintIntentions {
    fun forFinding(finding: Finding): List<IntentionAction> {
        val actions = mutableListOf<IntentionAction>()
        finding.fix?.let { actions += ApplyFixIntention(finding.ruleId, it.replacement, it.range) }
        actions += SuppressFindingIntention(finding.ruleId, finding.startLine)
        actions += OpenDocsIntention(finding.ruleId, docUrlFor(finding))
        return actions
    }

    /** Resolve the docs URL a finding points at, mirroring the annotator's tooltip. */
    fun docUrlFor(finding: Finding): String =
        finding.docUrl ?: "https://oauthlint.dev/rules/${finding.ruleId.removePrefix("auth.")}"
}

/** Family name shared by every OAuthLint intention (groups them in the popup). */
private const val FAMILY = "OAuthLint"

/**
 * Map a 1-based line/column onto a document character offset, clamped to the
 * line's bounds and the document. Mirrors the annotator's `lineColToOffset`;
 * offsets are derived from line/column rather than the fix's byte offsets
 * because document offsets are char-based (byte offsets would be wrong for any
 * non-ASCII byte before the match).
 */
private fun lineColToOffset(document: Document, line: Int, col: Int): Int {
    if (document.lineCount == 0) return 0
    val lineIdx = (line - 1).coerceIn(0, document.lineCount - 1)
    val lineStart = document.getLineStartOffset(lineIdx)
    val lineEnd = document.getLineEndOffset(lineIdx)
    return (lineStart + (col - 1)).coerceIn(lineStart, lineEnd)
}

/**
 * Apply the finding's autofix: replace the matched span with the rule's
 * rendered replacement text. The span is the fix's own [FixRange]; we build the
 * edit from line/column against the live document (see [lineColToOffset]).
 */
class ApplyFixIntention(
    private val ruleId: String,
    private val replacement: String,
    private val range: FixRange,
) : IntentionAction {
    override fun getText(): String = "Apply OAuthLint fix for $ruleId"
    override fun getFamilyName(): String = FAMILY
    override fun isAvailable(project: Project, editor: Editor?, file: PsiFile?): Boolean =
        editor != null

    override fun invoke(project: Project, editor: Editor?, file: PsiFile?) {
        val document = editor?.document ?: return
        val start = lineColToOffset(document, range.startLine, range.startCol)
        var end = lineColToOffset(document, range.endLine, range.endCol)
        if (end < start) end = start
        document.replaceString(start, end, replacement)
    }

    override fun startInWriteAction(): Boolean = true
}

/**
 * Insert an `oauthlint-disable-next-line <ruleId>` directive on the line above
 * the finding, suppressing it for the CLI and the plugin alike. The directive
 * text matches the CLI's suppression parser exactly (see
 * `cli/src/core/suppress.ts`); the comment prefix is taken from the file's
 * language so it is a valid comment (`//` for Java/JS/Go/Rust, `#` for Python).
 */
class SuppressFindingIntention(
    private val ruleId: String,
    private val startLine: Int,
) : IntentionAction {
    override fun getText(): String = "Suppress $ruleId on this line"
    override fun getFamilyName(): String = FAMILY
    override fun isAvailable(project: Project, editor: Editor?, file: PsiFile?): Boolean =
        editor != null

    override fun invoke(project: Project, editor: Editor?, file: PsiFile?) {
        val document = editor?.document ?: return
        if (document.lineCount == 0) return
        val lineIdx = (startLine - 1).coerceIn(0, document.lineCount - 1)
        val lineStart = document.getLineStartOffset(lineIdx)
        val lineEnd = document.getLineEndOffset(lineIdx)
        val lineText = document.getText(TextRange(lineStart, lineEnd))
        val indent = lineText.takeWhile { it == ' ' || it == '\t' }
        val commentPrefix = file?.let {
            LanguageCommenters.INSTANCE.forLanguage(it.language)?.lineCommentPrefix
        }?.takeUnless { it.isBlank() } ?: "//"
        val directive = "$indent$commentPrefix oauthlint-disable-next-line $ruleId\n"
        document.insertString(lineStart, directive)
    }

    override fun startInWriteAction(): Boolean = true
}

/** Open the rule's documentation in the browser. */
class OpenDocsIntention(
    private val ruleId: String,
    private val url: String,
) : IntentionAction {
    override fun getText(): String = "Open OAuthLint documentation for $ruleId"
    override fun getFamilyName(): String = FAMILY
    override fun isAvailable(project: Project, editor: Editor?, file: PsiFile?): Boolean = true

    override fun invoke(project: Project, editor: Editor?, file: PsiFile?) {
        BrowserUtil.browse(url)
    }

    override fun startInWriteAction(): Boolean = false
}
