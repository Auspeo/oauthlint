import net.openid.appauth.AuthorizationRequest
import net.openid.appauth.ResponseTypeValues
import android.net.Uri

// PKCE left on (Builder auto-generates the verifier): safe
fun buildRequest(config: Any, redirect: Uri): AuthorizationRequest {
    return AuthorizationRequest.Builder(config, "client-id", ResponseTypeValues.CODE, redirect)
        .setScope("openid profile")
        .build()
}

// explicit, self-generated verifier: safe
fun buildWithVerifier(config: Any, redirect: Uri, verifier: String): AuthorizationRequest {
    return AuthorizationRequest.Builder(config, "client-id", ResponseTypeValues.CODE, redirect)
        .setCodeVerifier(verifier)
        .build()
}
