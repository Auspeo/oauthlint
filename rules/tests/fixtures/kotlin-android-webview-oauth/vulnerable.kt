import android.webkit.WebView

class LoginActivity {
    fun startLogin(webView: WebView) {
        // ruleid: auth.kotlin.android.webview-oauth
        webView.loadUrl("https://accounts.example.com/oauth/authorize?client_id=abc&response_type=code")
    }

    fun startAuthorize(wv: WebView) {
        // ruleid: auth.kotlin.android.webview-oauth
        wv.loadUrl("https://idp.example.com/authorize?client_id=xyz")
    }
}
