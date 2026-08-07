using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;

public class Startup
{
    public void ConfigureServices(IServiceCollection services)
    {
        services.AddAuthentication().AddCookie(options =>
        {
            options.Cookie.Name = ".Auth";
            // ruleid: auth.csharp.cookie.secure-policy-none
            options.Cookie.SecurePolicy = CookieSecurePolicy.None;
        });
    }
}
