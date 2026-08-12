import com.auth0.jwt.JWT

fun currentUser(token: String): String {
    // ruleid: auth.kotlin.jwt.decode-without-verify
    val decoded = JWT.decode(token)
    return decoded.getClaim("sub").asString()
}

fun isAdmin(token: String): Boolean {
    // ruleid: auth.kotlin.jwt.decode-without-verify
    return JWT.decode(token).getClaim("role").asString() == "admin"
}
