package dev.oauthlint.toolwindow

import com.intellij.openapi.fileEditor.OpenFileDescriptor
import com.intellij.openapi.project.Project
import com.intellij.openapi.vfs.LocalFileSystem
import com.intellij.ui.ScrollPaneFactory
import com.intellij.ui.components.JBLabel
import com.intellij.ui.components.JBList
import com.intellij.util.ui.JBUI
import dev.oauthlint.annotator.OAuthLintIcons
import dev.oauthlint.scan.Finding
import dev.oauthlint.scan.Severity
import java.awt.BorderLayout
import java.awt.Component
import java.awt.event.KeyAdapter
import java.awt.event.KeyEvent
import java.awt.event.MouseAdapter
import java.awt.event.MouseEvent
import java.nio.file.Path
import javax.swing.DefaultListModel
import javax.swing.JList
import javax.swing.JPanel
import javax.swing.ListCellRenderer

/**
 * The OAuthLint tool-window content: a header line plus a flat, clickable list of
 * every finding from the last whole-project scan. Double-click or Enter navigates
 * to the finding's file and line. Mirrors the VS Code `scanWorkspace` experience
 * (one run over the project → one navigable list).
 */
class OAuthLintResultsPanel(private val project: Project) : JPanel(BorderLayout()) {

    private val model = DefaultListModel<Finding>()
    private val list = JBList(model)
    private val header = JBLabel("OAuthLint: run “OAuthLint: Scan Project” to list findings.")

    init {
        border = JBUI.Borders.empty(4)
        header.border = JBUI.Borders.emptyBottom(4)
        list.cellRenderer = FindingRenderer()

        list.addMouseListener(object : MouseAdapter() {
            override fun mouseClicked(e: MouseEvent) {
                if (e.clickCount == 2) navigateToSelected()
            }
        })
        list.addKeyListener(object : KeyAdapter() {
            override fun keyPressed(e: KeyEvent) {
                if (e.keyCode == KeyEvent.VK_ENTER) navigateToSelected()
            }
        })

        add(header, BorderLayout.NORTH)
        add(ScrollPaneFactory.createScrollPane(list), BorderLayout.CENTER)
    }

    /** Replace the listed findings (called on the EDT after a project scan). */
    fun setFindings(findings: List<Finding>) {
        model.clear()
        findings.forEach { model.addElement(it) }
        header.text = if (findings.isEmpty()) {
            "OAuthLint: no findings in the last project scan."
        } else {
            "OAuthLint: ${findings.size} finding${if (findings.size == 1) "" else "s"} (double-click to open)."
        }
    }

    /** Show that a scan is running. */
    fun setScanning() {
        header.text = "OAuthLint: scanning the project…"
    }

    private fun navigateToSelected() {
        val finding = list.selectedValue ?: return
        val vf = resolveFile(finding.filePath) ?: return
        OpenFileDescriptor(project, vf, (finding.startLine - 1).coerceAtLeast(0), (finding.startCol - 1).coerceAtLeast(0))
            .navigate(true)
    }

    /** Resolve a finding's path (absolute, or relative to the project root) to a VirtualFile. */
    private fun resolveFile(path: String): com.intellij.openapi.vfs.VirtualFile? {
        if (path.isEmpty()) return null
        val p = Path.of(path)
        val abs = if (p.isAbsolute) {
            p
        } else {
            val base = project.basePath ?: return null
            Path.of(base).resolve(p)
        }
        return LocalFileSystem.getInstance().findFileByPath(abs.toString().replace('\\', '/'))
    }

    /** One row: severity + rule id, message, and file:line. */
    private inner class FindingRenderer : ListCellRenderer<Finding> {
        private val delegate = JBLabel()

        override fun getListCellRendererComponent(
            list: JList<out Finding>,
            value: Finding,
            index: Int,
            isSelected: Boolean,
            cellHasFocus: Boolean,
        ): Component {
            val fileName = value.filePath.substringAfterLast('/').substringAfterLast('\\')
            val msg = value.message.lineSequence().firstOrNull()?.trim().orEmpty()
            delegate.icon = OAuthLintIcons.GUTTER
            delegate.text = "[${severityLabel(value.severity)}] ${value.ruleId} — $msg  ($fileName:${value.startLine})"
            delegate.border = JBUI.Borders.empty(2, 4)
            delegate.isOpaque = true
            delegate.background = if (isSelected) list.selectionBackground else list.background
            delegate.foreground = if (isSelected) list.selectionForeground else list.foreground
            return delegate
        }

        private fun severityLabel(s: Severity): String = s.name
    }
}
