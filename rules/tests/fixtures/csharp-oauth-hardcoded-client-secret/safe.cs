using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

public class Startup
{
    private readonly IConfiguration _config;

    public Startup(IConfiguration config)
    {
        _config = config;
    }

    public void ConfigureServices(IServiceCollection services)
    {
        services.AddAuthentication().AddOpenIdConnect(options =>
        {
            options.ClientId = "web-app";
            options.ClientSecret = _config["Authentication:ClientSecret"];
        });
    }
}
