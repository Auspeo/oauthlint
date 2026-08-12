import AuthenticationServices

func startLogin(url: URL, scheme: String, presenter: ASWebAuthenticationPresentationContextProviding) {
    let session = ASWebAuthenticationSession(url: url, callbackURLScheme: scheme) { _, _ in }
    session.presentationContextProvider = presenter

    // ruleid: auth.swift.flow.non-ephemeral-webauth
    session.prefersEphemeralWebBrowserSession = false

    session.start()
}
