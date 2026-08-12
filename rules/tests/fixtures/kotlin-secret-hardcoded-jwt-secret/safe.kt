import com.auth0.jwt.algorithms.Algorithm
import io.ktor.server.application.*

fun signerFromEnv(): Algorithm {
    return Algorithm.HMAC256(System.getenv("JWT_SECRET"))
}

fun signerFromConfig(app: Application): Algorithm {
    val secret = app.environment.config.property("jwt.secret").getString()
    return Algorithm.HMAC256(secret)
}

fun placeholderIsIgnored(): Algorithm {
    // Documentation placeholder, not a real secret.
    return Algorithm.HMAC256("changeme")
}
