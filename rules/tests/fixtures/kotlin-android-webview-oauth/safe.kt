import android.net.Uri
import android.webkit.WebView
import androidx.browser.customtabs.CustomTabsIntent
import net.openid.appauth.AuthorizationService

class LoginActivity {
    // Custom Tabs external browser: safe
    fun startLogin(context: android.content.Context) {
        val intent = CustomTabsIntent.Builder().build()
        intent.launchUrl(context, Uri.parse("https://accounts.example.com/oauth/authorize?client_id=abc"))
    }

    // AppAuth system-browser flow: safe
    fun startAuthorize(service: AuthorizationService, request: net.openid.appauth.AuthorizationRequest) {
        service.performAuthorizationRequest(request, pendingIntent)
    }

    // WebView loading a non-auth page: safe
    fun showHelp(webView: WebView) {
        webView.loadUrl("https://example.com/help")
    }
}
