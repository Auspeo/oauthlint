import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*

fun Application.configureSecurity(secret: String) {
    install(Authentication) {
        jwt("auth-jwt") {
            // ruleid: auth.kotlin.jwt.missing-issuer-audience
            verifier(
                JWT.require(Algorithm.HMAC256(secret))
                    .acceptLeeway(3)
                    .build()
            )
            validate { credential -> JWTPrincipal(credential.payload) }
        }
    }
}
