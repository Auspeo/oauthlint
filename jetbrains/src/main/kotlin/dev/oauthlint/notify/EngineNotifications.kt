package dev.oauthlint.notify

import com.intellij.notification.NotificationAction
import com.intellij.notification.NotificationGroupManager
import com.intellij.notification.NotificationType
import com.intellij.openapi.project.Project
import java.util.concurrent.atomic.AtomicBoolean

/**
 * User-facing notifications for OAuthLint. The main case is a one-time, actionable
 * notice when the scan engine cannot be obtained (typically an offline first run),
 * offering a Retry that clears the resolution memo and re-triggers a scan.
 */
object EngineNotifications {
    private const val GROUP_ID = "OAuthLint"

    // Warn at most once per session so a rescan storm cannot spam the user.
    private val warned = AtomicBoolean(false)

    /**
     * Surface the engine-unavailable notice once. [onRetry] is invoked when the
     * user clicks Retry (it should reset the engine memo and re-run the scan).
     */
    fun engineUnavailable(project: Project?, detail: String, onRetry: () -> Unit) {
        if (!warned.compareAndSet(false, true)) return
        val group = NotificationGroupManager.getInstance().getNotificationGroup(GROUP_ID)
        val notification = group.createNotification(
            "OAuthLint could not start its scan engine",
            detail,
            NotificationType.WARNING,
        )
        notification.addAction(object : NotificationAction("Retry") {
            override fun actionPerformed(
                e: com.intellij.openapi.actionSystem.AnActionEvent,
                notification: com.intellij.notification.Notification,
            ) {
                // Allow the notice to fire again if a retry also fails.
                warned.set(false)
                notification.expire()
                onRetry()
            }
        })
        notification.notify(project)
    }

    /** Reset the once-per-session guard (e.g. after a successful scan). */
    fun resetWarning() {
        warned.set(false)
    }
}
