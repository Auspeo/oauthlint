import io.ktor.server.application.*
import io.ktor.server.sessions.*

data class UserSession(val userId: String)

fun Application.configureSessions() {
    install(Sessions) {
        // ruleid: auth.kotlin.cookie.insecure-session
        cookie<UserSession>("SESSION") {
            cookie.path = "/"
            cookie.maxAgeInSeconds = 3600
        }
    }
}
