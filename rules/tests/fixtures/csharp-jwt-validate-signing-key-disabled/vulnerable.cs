using Microsoft.IdentityModel.Tokens;

public class Startup
{
    public void ConfigureAuth()
    {
        var tvp = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            // ruleid: auth.csharp.jwt.validate-signing-key-disabled
            ValidateIssuerSigningKey = false,
        };
    }
}
