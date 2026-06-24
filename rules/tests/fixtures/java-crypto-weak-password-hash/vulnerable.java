import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

class WeakPasswordHash {

    byte[] md5Password(String password) throws NoSuchAlgorithmException {
        MessageDigest md = MessageDigest.getInstance("MD5");
        // ruleid: auth.java.crypto.weak-password-hash
        return md.digest(password.getBytes());
    }

    byte[] sha1Password(String passwd) throws NoSuchAlgorithmException {
        MessageDigest md = MessageDigest.getInstance("SHA-1");
        // ruleid: auth.java.crypto.weak-password-hash
        return md.digest(passwd.getBytes("UTF-8"));
    }

    byte[] sha256Password(String userPassword) throws NoSuchAlgorithmException {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        // ruleid: auth.java.crypto.weak-password-hash
        return md.digest(userPassword.getBytes());
    }

    byte[] sha512PasswordUpdate(String pwd) throws Exception {
        MessageDigest md = MessageDigest.getInstance("SHA-512");
        // ruleid: auth.java.crypto.weak-password-hash
        md.update(pwd.getBytes());
        return md.digest();
    }
}
