import Vapor

func configureCORS(_ app: Application) {
    // ruleid: auth.swift.cors.wildcard-with-credentials
    let config = CORSMiddleware.Configuration(
        allowedOrigin: .all,
        allowedMethods: [.GET, .POST],
        allowedHeaders: [.authorization, .contentType],
        allowCredentials: true
    )
    app.middleware.use(CORSMiddleware(configuration: config))
}
