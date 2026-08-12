import net.openid.appauth.AuthorizationRequest
import net.openid.appauth.ResponseTypeValues
import android.net.Uri

fun buildRequest(config: Any, redirect: Uri): AuthorizationRequest {
    // ruleid: auth.kotlin.android.pkce-disabled
    return AuthorizationRequest.Builder(config, "client-id", ResponseTypeValues.CODE, redirect)
        .setScope("openid profile")
        .setCodeVerifier(null)
        .build()
}
