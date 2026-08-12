using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Authentication.Cookies;

public class CookieConfig
{
    public CookieOptions BuildInitializer()
    {
        return new CookieOptions
        {
            HttpOnly = true,
            // ruleid: auth.csharp.cookie.samesite-none
            SameSite = SameSiteMode.None,
        };
    }

    public void ConfigureAuthCookie(CookieAuthenticationOptions options)
    {
        // ruleid: auth.csharp.cookie.samesite-none
        options.Cookie.SameSite = SameSiteMode.None;
    }
}
