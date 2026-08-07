using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.Extensions.DependencyInjection;

public class Startup
{
    public void ConfigureServices(IServiceCollection services)
    {
        services.AddAuthentication().AddOpenIdConnect(options =>
        {
            options.ClientId = "web-app";
            // ruleid: auth.csharp.oauth.hardcoded-client-secret
            options.ClientSecret = "9f8e7d6c-5b4a-3210-fedc-ba9876543210";
        });
    }
}
