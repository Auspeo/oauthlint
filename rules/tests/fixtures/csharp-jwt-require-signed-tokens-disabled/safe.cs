using Microsoft.IdentityModel.Tokens;

public class Startup
{
    // Secure default (true) left in place; signatures are required.
    public TokenValidationParameters Build()
    {
        return new TokenValidationParameters
        {
            ValidateIssuer = true,
            RequireSignedTokens = true,
            ValidateIssuerSigningKey = true,
        };
    }
}
