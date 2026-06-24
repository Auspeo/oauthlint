import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;

class CookieConfig {

    void loginSession(HttpServletResponse response) {
        Cookie session = new Cookie("SESSION", "abc123");
        // ruleid: auth.java.cookie.insecure
        session.setSecure(false);
        response.addCookie(session);
    }

    void authToken(HttpServletResponse response) {
        Cookie auth = new Cookie("AUTH_TOKEN", "tok");
        // ruleid: auth.java.cookie.insecure
        auth.setHttpOnly(false);
        response.addCookie(auth);
    }

    void refreshCookie(HttpServletResponse response) {
        Cookie refresh = new Cookie("REFRESH", "r");
        // ruleid: auth.java.cookie.insecure
        refresh.setSecure(false);
        refresh.setHttpOnly(true);
        response.addCookie(refresh);
    }
}
