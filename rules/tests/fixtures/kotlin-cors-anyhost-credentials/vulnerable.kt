import io.ktor.server.application.*
import io.ktor.server.plugins.cors.routing.*

fun Application.configureCors() {
    install(CORS) {
        // ruleid: auth.kotlin.cors.anyhost-credentials
        anyHost()
        allowCredentials = true
    }
}
