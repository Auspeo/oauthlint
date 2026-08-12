import WebKit

func showLogin(in webView: WKWebView) {
    // ruleid: auth.swift.flow.oauth-in-wkwebview
    webView.load(URLRequest(url: URL(string: "https://accounts.google.com/o/oauth2/auth?client_id=123&response_type=code")!))

    // ruleid: auth.swift.flow.oauth-in-wkwebview
    webView.load(URLRequest(url: URL(string: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?response_type=code")!))
}
