package dev.oauthlint.settings

import com.intellij.openapi.options.Configurable
import com.intellij.openapi.ui.ComboBox
import com.intellij.ui.components.JBCheckBox
import com.intellij.ui.components.JBLabel
import com.intellij.ui.components.JBTextField
import com.intellij.util.ui.FormBuilder
import javax.swing.JComponent
import javax.swing.JPanel

/**
 * The OAuthLint settings page, shown under Settings | Tools | OAuthLint. A small
 * form over the persisted [OAuthLintSettings]: enable/disable, the minimum
 * severity to surface, and an optional engine-binary override.
 */
class OAuthLintConfigurable : Configurable {

    private val severities = arrayOf("INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL")

    private val enabledCheckbox = JBCheckBox("Scan files on open and save")
    private val minSeverityCombo = ComboBox(severities)
    private val enginePathField = JBTextField()

    private var panel: JPanel? = null

    override fun getDisplayName(): String = "OAuthLint"

    override fun createComponent(): JComponent {
        val built = FormBuilder.createFormBuilder()
            .addComponent(enabledCheckbox)
            .addLabeledComponent("Minimum severity:", minSeverityCombo)
            .addLabeledComponent("Engine path (optional):", enginePathField)
            .addComponentToRightColumn(
                JBLabel(
                    "Leave the engine path empty to download and cache Opengrep automatically. " +
                        "Set it to point at an installed opengrep or semgrep binary.",
                ),
            )
            .addComponentFillVertically(JPanel(), 0)
            .panel
        panel = built
        reset()
        return built
    }

    override fun isModified(): Boolean {
        val s = OAuthLintSettings.getInstance().state
        return enabledCheckbox.isSelected != s.enabled ||
            (minSeverityCombo.selectedItem as String) != s.minSeverity ||
            enginePathField.text.trim() != s.enginePath
    }

    override fun apply() {
        val s = OAuthLintSettings.getInstance().state
        s.enabled = enabledCheckbox.isSelected
        s.minSeverity = minSeverityCombo.selectedItem as String
        s.enginePath = enginePathField.text.trim()
    }

    override fun reset() {
        val s = OAuthLintSettings.getInstance().state
        enabledCheckbox.isSelected = s.enabled
        minSeverityCombo.selectedItem = if (s.minSeverity in severities) s.minSeverity else "MEDIUM"
        enginePathField.text = s.enginePath
    }

    override fun disposeUIResources() {
        panel = null
    }
}
