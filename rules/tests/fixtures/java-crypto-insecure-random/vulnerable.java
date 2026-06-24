import java.util.Random;

class TokenFactory {

    String makeToken() {
        // ruleid: auth.java.crypto.insecure-random
        long token = new Random().nextLong();
        return Long.toHexString(token);
    }

    double makeSecret() {
        // ruleid: auth.java.crypto.insecure-random
        double secret = Math.random();
        return secret;
    }

    int makeOtp() {
        // ruleid: auth.java.crypto.insecure-random
        int otp = new java.util.Random().nextInt(1000000);
        return otp;
    }

    byte[] makeKeyBytes() {
        Random rnd = new Random();
        byte[] keyMaterial = new byte[32];
        // ruleid: auth.java.crypto.insecure-random
        rnd.nextBytes(keyMaterial);
        return keyMaterial;
    }
}
