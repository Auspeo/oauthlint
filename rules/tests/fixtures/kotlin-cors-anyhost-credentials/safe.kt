import io.ktor.server.application.*
import io.ktor.server.plugins.cors.routing.*

fun Application.configureCors() {
    install(CORS) {
        allowHost("app.example.com", schemes = listOf("https"))
        allowCredentials = true
    }
}

fun Application.configurePublicCors() {
    // anyHost without credentials is a public, read-only API — out of scope.
    install(CORS) {
        anyHost()
    }
}
