import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm

fun createToken(): String {
    val algorithm = Algorithm.HMAC256(System.getenv("JWT_SECRET"))
    return JWT.create()
        .withSubject("user-42")
        .sign(algorithm)
}

fun buildVerifier(token: String) {
    val algorithm = Algorithm.HMAC256(System.getenv("JWT_SECRET"))
    val verifier = JWT.require(algorithm)
        .withIssuer("https://idp.example.com")
        .withAudience("my-api")
        .build()
    verifier.verify(token)
}
