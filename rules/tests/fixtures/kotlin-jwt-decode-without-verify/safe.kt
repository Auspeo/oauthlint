import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm

fun currentUser(token: String): String {
    val verifier = JWT.require(Algorithm.HMAC256(System.getenv("JWT_SECRET")))
        .withIssuer("https://idp.example.com")
        .withAudience("my-api")
        .build()
    val decoded = verifier.verify(token)
    return decoded.getClaim("sub").asString()
}
