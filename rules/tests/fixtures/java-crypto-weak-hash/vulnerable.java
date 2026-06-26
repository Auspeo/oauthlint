import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

class WeakHash {

    // Integrity fingerprint over file bytes with a broken digest.
    byte[] md5Checksum(byte[] data) throws NoSuchAlgorithmException {
        // ruleid: auth.java.crypto.weak-hash
        MessageDigest md = MessageDigest.getInstance("MD5");
        return md.digest(data);
    }

    // SHA-1 used to fingerprint a token / sign content — collision-prone.
    byte[] sha1TokenFingerprint(byte[] token) throws NoSuchAlgorithmException {
        // ruleid: auth.java.crypto.weak-hash
        MessageDigest md = MessageDigest.getInstance("SHA-1");
        return md.digest(token);
    }

    // The hyphenless "SHA1" alias is the same broken algorithm.
    byte[] sha1Alias(byte[] data) throws NoSuchAlgorithmException {
        // ruleid: auth.java.crypto.weak-hash
        MessageDigest md = MessageDigest.getInstance("SHA1");
        return md.digest(data);
    }
}
