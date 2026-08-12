import WebKit

func showContent(in webView: WKWebView) {
    // A non-auth URL in a WKWebView is fine; OAuth belongs in ASWebAuthenticationSession.
    webView.load(URLRequest(url: URL(string: "https://example.com/help/getting-started")!))
    webView.load(URLRequest(url: URL(string: "https://blog.example.com/2026/release-notes")!))
}
