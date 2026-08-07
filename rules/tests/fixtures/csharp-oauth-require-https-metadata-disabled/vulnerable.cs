using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.DependencyInjection;

public class Startup
{
    public void ConfigureServices(IServiceCollection services)
    {
        services.AddAuthentication().AddJwtBearer(options =>
        {
            options.Authority = "https://issuer.example.com";
            // ruleid: auth.csharp.oauth.require-https-metadata-disabled
            options.RequireHttpsMetadata = false;
        });
    }
}
