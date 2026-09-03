package dev.oauthlint.action

import com.intellij.openapi.actionSystem.ActionUpdateThread
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.components.service
import com.intellij.openapi.diagnostic.logger
import com.intellij.openapi.progress.ProgressIndicator
import com.intellij.openapi.progress.Task
import com.intellij.openapi.project.Project
import com.intellij.openapi.wm.ToolWindowManager
import dev.oauthlint.engine.EngineManager
import dev.oauthlint.engine.EngineUnavailableException
import dev.oauthlint.notify.EngineNotifications
import dev.oauthlint.rules.RuleBundle
import dev.oauthlint.scan.Finding
import dev.oauthlint.scan.OpenGrepScanner
import dev.oauthlint.scan.Severity
import dev.oauthlint.settings.OAuthLintSettings
import dev.oauthlint.toolwindow.OAuthLintResultsService

private const val TOOL_WINDOW_ID = "OAuthLint"

/**
 * "OAuthLint: Scan Project" — runs a SINGLE Opengrep pass over the whole project
 * root (not per file) and lists every finding in the OAuthLint tool window, where
 * each row navigates to its file and line. Mirrors the VS Code `scanWorkspace`
 * command. The scan runs off the EDT in a background task (it may download the
 * engine on first use); results are pushed back on the EDT.
 */
class ScanProjectAction : AnAction() {

    private val log = logger<ScanProjectAction>()

    override fun getActionUpdateThread(): ActionUpdateThread = ActionUpdateThread.BGT

    override fun update(e: AnActionEvent) {
        e.presentation.isEnabled = e.project?.basePath != null
    }

    override fun actionPerformed(e: AnActionEvent) {
        val project = e.project ?: return
        val projectDir = project.basePath ?: return

        // Show the tool window immediately with a "scanning…" header.
        activateAndUpdate(project) { it.setScanning() }

        val settings = OAuthLintSettings.getInstance().state
        val minSeverity = runCatching { Severity.valueOf(settings.minSeverity.uppercase()) }
            .getOrDefault(Severity.MEDIUM)

        object : Task.Backgroundable(project, "OAuthLint: scanning project", true) {
            override fun run(indicator: ProgressIndicator) {
                indicator.isIndeterminate = true
                val app = ApplicationManager.getApplication()
                val findings: List<Finding> = try {
                    val engine = app.service<EngineManager>().resolve { indicator.text = it }
                    val rulesDir = app.service<RuleBundle>().resolveConfigDir()
                    // ONE run over the project directory (no per-file subprocess),
                    // with a longer budget than the live per-file annotator.
                    OpenGrepScanner(engine, rulesDir)
                        .scan(projectDir, timeoutMs = 180_000)
                        .filter { it.severity.ordinal >= minSeverity.ordinal }
                        .sortedWith(compareByDescending<Finding> { it.severity.ordinal }.thenBy { it.filePath })
                } catch (ex: EngineUnavailableException) {
                    log.warn("OAuthLint: project scan engine unavailable: ${ex.message}")
                    app.invokeLater {
                        EngineNotifications.engineUnavailable(project, ex.message ?: "The scan engine could not be started.") {
                            app.service<EngineManager>().reset()
                        }
                        activateAndUpdate(project) { it.setFindings(emptyList()) }
                    }
                    return
                } catch (ex: Exception) {
                    log.warn("OAuthLint: project scan failed: ${ex.message}")
                    app.invokeLater { activateAndUpdate(project) { it.setFindings(emptyList()) } }
                    return
                }
                EngineNotifications.resetWarning()
                app.invokeLater { activateAndUpdate(project) { it.setFindings(findings) } }
            }
        }.queue()
    }

    /**
     * Activate the tool window (building its panel via the factory on first use)
     * and run [update] against the registered panel once it exists.
     */
    private fun activateAndUpdate(project: Project, update: (dev.oauthlint.toolwindow.OAuthLintResultsPanel) -> Unit) {
        val toolWindow = ToolWindowManager.getInstance(project).getToolWindow(TOOL_WINDOW_ID) ?: return
        toolWindow.activate {
            project.service<OAuthLintResultsService>().panel?.let(update)
        }
    }
}
