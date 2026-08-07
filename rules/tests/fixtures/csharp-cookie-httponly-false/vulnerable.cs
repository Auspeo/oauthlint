using Microsoft.AspNetCore.Http;

public class SessionController
{
    public void WriteSession(HttpResponse response, string token)
    {
        response.Cookies.Append("session", token, new CookieOptions
        {
            Secure = true,
            // ruleid: auth.csharp.cookie.httponly-false
            HttpOnly = false,
        });
    }
}
