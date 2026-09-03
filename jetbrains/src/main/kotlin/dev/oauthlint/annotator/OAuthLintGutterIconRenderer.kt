package dev.oauthlint.annotator

import com.intellij.ide.BrowserUtil
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.editor.markup.GutterIconRenderer
import javax.swing.Icon

/**
 * Clickable OAuthLint gutter icon for a finding line. Attached to the finding's
 * annotation via `AnnotationBuilder.gutterIconRenderer(...)`, so it reuses the
 * findings the annotator already computed — no second scan/subprocess (which a
 * standalone `LineMarkerProvider` would require). The tooltip carries the rule
 * summary; clicking opens the rule documentation.
 *
 * [GutterIconRenderer] requires value equality so the platform can de-duplicate
 * identical markers across highlighting passes.
 */
class OAuthLintGutterIconRenderer(
    private val tooltip: String,
    private val docUrl: String,
) : GutterIconRenderer() {

    override fun getIcon(): Icon = OAuthLintIcons.GUTTER

    override fun getTooltipText(): String = tooltip

    override fun isNavigateAction(): Boolean = true

    override fun getClickAction(): AnAction = object : AnAction() {
        override fun actionPerformed(e: AnActionEvent) {
            BrowserUtil.browse(docUrl)
        }
    }

    override fun equals(other: Any?): Boolean =
        other is OAuthLintGutterIconRenderer && other.tooltip == tooltip && other.docUrl == docUrl

    override fun hashCode(): Int = 31 * tooltip.hashCode() + docUrl.hashCode()
}
