using Microsoft.AspNetCore.Http;

public class SessionController
{
    public void WriteSession(HttpResponse response, string token)
    {
        response.Cookies.Append("session", token, new CookieOptions
        {
            Secure = true,
            HttpOnly = true,
        });
    }
}
