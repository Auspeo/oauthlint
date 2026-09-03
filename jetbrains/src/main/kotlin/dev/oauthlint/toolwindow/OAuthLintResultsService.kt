package dev.oauthlint.toolwindow

import com.intellij.openapi.components.Service

/**
 * Project-level holder for the OAuthLint tool-window panel. The tool window is
 * created lazily by the platform, so the scan action activates the window (which
 * builds the panel through the factory, registering it here) and then pushes the
 * findings into whatever panel is registered.
 */
@Service(Service.Level.PROJECT)
class OAuthLintResultsService {
    @Volatile
    var panel: OAuthLintResultsPanel? = null
}
