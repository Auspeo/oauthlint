import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm

fun createToken(): String {
    // ruleid: auth.kotlin.jwt.algorithm-none
    val algorithm = Algorithm.none()
    return JWT.create()
        .withSubject("user-42")
        .sign(algorithm)
}

fun buildVerifier(token: String) {
    // ruleid: auth.kotlin.jwt.algorithm-none
    val verifier = JWT.require(Algorithm.none()).build()
    verifier.verify(token)
}
