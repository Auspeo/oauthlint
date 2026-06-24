import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;

class SafePasswordHash {

    // ok: auth.java.crypto.weak-password-hash -- BCrypt is a proper password hasher
    String bcrypt(String password) {
        return new BCryptPasswordEncoder().encode(password);
    }

    // ok: auth.java.crypto.weak-password-hash -- Argon2 is a proper password hasher
    String argon2(String password) {
        return Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8().encode(password);
    }

    // ok: auth.java.crypto.weak-password-hash -- SHA-256 over file bytes is a checksum, not a password
    byte[] fileChecksum(byte[] fileBytes) throws NoSuchAlgorithmException {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        return md.digest(fileBytes);
    }

    // ok: auth.java.crypto.weak-password-hash -- non-password fingerprint
    byte[] contentFingerprint(String content) throws NoSuchAlgorithmException {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        return md.digest(content.getBytes());
    }
}
