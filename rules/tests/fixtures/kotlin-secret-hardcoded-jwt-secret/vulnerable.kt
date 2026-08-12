import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm

fun signer(): Algorithm {
    // ruleid: auth.kotlin.secret.hardcoded-jwt-secret
    return Algorithm.HMAC256("s3cr3t-signing-key-do-not-share")
}

fun strongSigner(): Algorithm {
    // ruleid: auth.kotlin.secret.hardcoded-jwt-secret
    return Algorithm.HMAC512("another-inlined-super-secret-value")
}
