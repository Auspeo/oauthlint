import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

class SafeHash {

    // ok: auth.java.crypto.weak-hash -- SHA-256 is a strong digest
    byte[] sha256Checksum(byte[] data) throws NoSuchAlgorithmException {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        return md.digest(data);
    }

    // ok: auth.java.crypto.weak-hash -- SHA-512 is a strong digest
    byte[] sha512Fingerprint(byte[] data) throws NoSuchAlgorithmException {
        MessageDigest md = MessageDigest.getInstance("SHA-512");
        return md.digest(data);
    }
}
