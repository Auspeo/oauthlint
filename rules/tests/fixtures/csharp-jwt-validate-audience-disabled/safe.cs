using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

public class Startup
{
    // An OIDC framework validates the audience itself, outside any JWT bearer
    // registration. Disabling the built-in check here is deliberate, not a
    // footgun, so it must NOT fire (no AddJwtBearer context).
    public static readonly TokenValidationParameters FrameworkDefaults = new TokenValidationParameters
    {
        ValidateAudience = false,
    };

    public void ConfigureServices(IServiceCollection services)
    {
        services.AddAuthentication().AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateAudience = true,
                ValidAudience = "https://api.example.com",
            };
        });
    }
}
