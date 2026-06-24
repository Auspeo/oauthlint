import javax.crypto.Cipher;
import javax.crypto.NoSuchPaddingException;
import java.security.NoSuchAlgorithmException;

class EcbModeVulnerable {

    Cipher explicitEcb() throws NoSuchAlgorithmException, NoSuchPaddingException {
        // ruleid: auth.java.crypto.ecb-mode
        return Cipher.getInstance("AES/ECB/PKCS5Padding");
    }

    Cipher bareAesAlias() throws NoSuchAlgorithmException, NoSuchPaddingException {
        // ruleid: auth.java.crypto.ecb-mode
        return Cipher.getInstance("AES");
    }

    Cipher bareDesAlias() throws NoSuchAlgorithmException, NoSuchPaddingException {
        // ruleid: auth.java.crypto.ecb-mode
        return Cipher.getInstance("DES");
    }
}
