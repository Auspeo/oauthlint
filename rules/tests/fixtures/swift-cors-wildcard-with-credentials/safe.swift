import Vapor

func configureCORS(_ app: Application) {
    // Explicit origin allow-list with credentials.
    let restricted = CORSMiddleware.Configuration(
        allowedOrigin: .custom("https://app.example.com"),
        allowedMethods: [.GET, .POST],
        allowedHeaders: [.authorization, .contentType],
        allowCredentials: true
    )
    app.middleware.use(CORSMiddleware(configuration: restricted))

    // Wildcard origin, but no credentials are sent.
    let publicAPI = CORSMiddleware.Configuration(
        allowedOrigin: .all,
        allowedMethods: [.GET],
        allowedHeaders: [.contentType],
        allowCredentials: false
    )
    app.middleware.use(CORSMiddleware(configuration: publicAPI))
}
