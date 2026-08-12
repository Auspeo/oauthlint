using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Authentication.Cookies;

public class CookieConfig
{
    // Framework-default-aligned SameSite values keep the CSRF defense.
    public CookieOptions BuildInitializer()
    {
        return new CookieOptions
        {
            HttpOnly = true,
            SameSite = SameSiteMode.Lax,
        };
    }

    public void ConfigureAuthCookie(CookieAuthenticationOptions options)
    {
        options.Cookie.SameSite = SameSiteMode.Strict;
    }
}
