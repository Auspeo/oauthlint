import io.ktor.server.application.*
import io.ktor.server.sessions.*

data class UserSession(val userId: String)

fun Application.configureSessions(encryptKey: ByteArray, signKey: ByteArray) {
    install(Sessions) {
        cookie<UserSession>("SESSION") {
            cookie.path = "/"
            cookie.maxAgeInSeconds = 3600
            cookie.secure = true
            cookie.httpOnly = true
            transform(SessionTransportTransformerEncrypt(encryptKey, signKey))
        }
    }
}
