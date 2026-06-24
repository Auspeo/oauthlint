import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;

class SafeCookieConfig {

    void loginSession(HttpServletResponse response) {
        Cookie cookie = new Cookie("SESSION", "abc123");
        // ok: auth.java.cookie.insecure
        cookie.setSecure(true);
        cookie.setHttpOnly(true);
        response.addCookie(cookie);
    }

    void noFlags(HttpServletResponse response) {
        Cookie cookie = new Cookie("PREFS", "dark");
        // ok: auth.java.cookie.insecure
        response.addCookie(cookie);
    }
}
