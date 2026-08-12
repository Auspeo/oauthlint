import android.content.Context

class TokenStore(context: Context) {
    private val prefs = context.getSharedPreferences("app", Context.MODE_PRIVATE)

    fun save(token: String) {
        // ruleid: auth.kotlin.android.token-in-sharedprefs
        prefs.edit().putString("auth_token", token).apply()
    }

    fun saveSecret(secret: String) {
        // ruleid: auth.kotlin.android.token-in-sharedprefs
        prefs.edit { putString("client_secret", secret) }
    }
}
