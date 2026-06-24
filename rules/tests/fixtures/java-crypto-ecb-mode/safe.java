import javax.crypto.Cipher;
import javax.crypto.NoSuchPaddingException;
import java.security.NoSuchAlgorithmException;

class EcbModeSafe {

    // ok: auth.java.crypto.ecb-mode -- authenticated GCM mode
    Cipher gcm() throws NoSuchAlgorithmException, NoSuchPaddingException {
        return Cipher.getInstance("AES/GCM/NoPadding");
    }

    // ok: auth.java.crypto.ecb-mode -- CBC with explicit padding (use a random IV)
    Cipher cbc() throws NoSuchAlgorithmException, NoSuchPaddingException {
        return Cipher.getInstance("AES/CBC/PKCS5Padding");
    }

    // ok: auth.java.crypto.ecb-mode -- asymmetric RSA with OAEP, not symmetric block ECB
    Cipher rsa() throws NoSuchAlgorithmException, NoSuchPaddingException {
        return Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");
    }
}
