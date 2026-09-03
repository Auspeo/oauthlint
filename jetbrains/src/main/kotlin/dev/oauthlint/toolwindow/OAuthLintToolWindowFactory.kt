package dev.oauthlint.toolwindow

import com.intellij.openapi.components.service
import com.intellij.openapi.project.Project
import com.intellij.openapi.wm.ToolWindow
import com.intellij.openapi.wm.ToolWindowFactory
import com.intellij.ui.content.ContentFactory

/**
 * Builds the OAuthLint tool-window content on first activation and registers the
 * panel with [OAuthLintResultsService] so the "Scan Project" action can push
 * findings into it. Registered in plugin.xml under `toolWindow id="OAuthLint"`.
 */
class OAuthLintToolWindowFactory : ToolWindowFactory {
    override fun createToolWindowContent(project: Project, toolWindow: ToolWindow) {
        val panel = OAuthLintResultsPanel(project)
        project.service<OAuthLintResultsService>().panel = panel
        val content = ContentFactory.getInstance().createContent(panel, "Findings", false)
        toolWindow.contentManager.addContent(content)
    }
}
