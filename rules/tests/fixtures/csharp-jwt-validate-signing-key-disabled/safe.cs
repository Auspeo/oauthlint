using Microsoft.IdentityModel.Tokens;

public class Startup
{
    public void ConfigureAuth()
    {
        var tvp = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = LoadKeyFromConfig(),
        };
    }
}
