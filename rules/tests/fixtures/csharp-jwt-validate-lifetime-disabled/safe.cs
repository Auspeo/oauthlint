using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

public class Startup
{
    // An OIDC framework validates the token lifetime itself, outside any JWT
    // bearer registration. Disabling the built-in check here is deliberate, so
    // it must NOT fire (no AddJwtBearer context).
    public static readonly TokenValidationParameters FrameworkDefaults = new TokenValidationParameters
    {
        ValidateLifetime = false,
    };

    public void ConfigureServices(IServiceCollection services)
    {
        services.AddAuthentication().AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateLifetime = true,
                ClockSkew = System.TimeSpan.Zero,
            };
        });
    }
}
