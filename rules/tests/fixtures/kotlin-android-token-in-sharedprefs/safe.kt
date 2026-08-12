import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences

class TokenStore(context: Context) {
    private val plainPrefs = context.getSharedPreferences("app", Context.MODE_PRIVATE)

    fun saveEncrypted(context: Context, token: String) {
        val prefs = EncryptedSharedPreferences.create(
            context, "secure_prefs", masterKey, AES256_SIV, AES256_GCM)
        // encrypted storage: safe
        prefs.edit().putString("auth_token", token).apply()
    }

    fun saveUsername(name: String) {
        // non-credential key: safe
        plainPrefs.edit().putString("username", name).apply()
    }
}
