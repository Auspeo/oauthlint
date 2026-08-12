import AuthenticationServices

func startLogin(url: URL, scheme: String, presenter: ASWebAuthenticationPresentationContextProviding) {
    let session = ASWebAuthenticationSession(url: url, callbackURLScheme: scheme) { _, _ in }
    session.presentationContextProvider = presenter

    // Private, cookie-isolated session per authorization.
    session.prefersEphemeralWebBrowserSession = true

    session.start()
}
