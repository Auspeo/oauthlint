import java.security.SecureRandom;
import java.util.Random;

class SafeTokenFactory {

    byte[] makeKeyBytes() {
        SecureRandom rnd = new SecureRandom();
        byte[] keyMaterial = new byte[32];
        // ok: auth.java.crypto.insecure-random
        rnd.nextBytes(keyMaterial);
        return keyMaterial;
    }

    long makeSecureToken() {
        // ok: auth.java.crypto.insecure-random
        long token = new SecureRandom().nextLong();
        return token;
    }

    int pickShardIndex() {
        // ok: auth.java.crypto.insecure-random
        int idx = new Random().nextInt(10);
        return idx;
    }

    int jitterMillis() {
        Random rnd = new Random();
        // ok: auth.java.crypto.insecure-random
        int jitter = rnd.nextInt(500);
        return jitter;
    }
}
