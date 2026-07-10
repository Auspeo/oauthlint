package dev.oauthlint.settings

import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.components.PersistentStateComponent
import com.intellij.openapi.components.State
import com.intellij.openapi.components.Storage
import com.intellij.openapi.components.service
import com.intellij.util.xmlb.XmlSerializerUtil

/**
 * Persistent, application-wide OAuthLint settings. Registered as an application
 * service (see plugin.xml) and persisted to `oauthlint.xml` in the IDE config.
 */
@State(
    name = "dev.oauthlint.settings.OAuthLintSettings",
    storages = [Storage("oauthlint.xml")],
)
class OAuthLintSettings : PersistentStateComponent<OAuthLintSettings.State> {

    /** Mutable, serialisable settings holder. Fields must stay public + var. */
    class State {
        /** Scan files on open/save. */
        @JvmField
        var enabled: Boolean = true

        /** Only surface findings at this severity or above (INFO..CRITICAL). */
        @JvmField
        var minSeverity: String = "MEDIUM"

        /** Override the engine binary. Empty = auto (cached download or PATH). */
        @JvmField
        var enginePath: String = ""
    }

    private var state = State()

    override fun getState(): State = state

    override fun loadState(state: State) {
        XmlSerializerUtil.copyBean(state, this.state)
    }

    companion object {
        fun getInstance(): OAuthLintSettings =
            ApplicationManager.getApplication().service<OAuthLintSettings>()
    }
}
