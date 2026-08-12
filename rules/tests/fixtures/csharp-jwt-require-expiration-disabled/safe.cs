using Microsoft.IdentityModel.Tokens;

public class Startup
{
    // Secure default (true) left in place; every token must carry an exp claim.
    public TokenValidationParameters Build()
    {
        return new TokenValidationParameters
        {
            ValidateLifetime = true,
            RequireExpirationTime = true,
        };
    }
}
