using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.Extensions.DependencyInjection;

public class Startup
{
    public void ConfigureServices(IServiceCollection services)
    {
        services.AddAuthentication().AddOpenIdConnect(options =>
        {
            options.Authority = "https://issuer.example.com";
            options.ResponseType = "code";
            options.UsePkce = true;
        });
    }
}
