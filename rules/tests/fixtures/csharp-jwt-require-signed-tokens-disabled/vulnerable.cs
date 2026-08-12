using Microsoft.IdentityModel.Tokens;

public class Startup
{
    public TokenValidationParameters BuildInitializer()
    {
        return new TokenValidationParameters
        {
            ValidateIssuer = true,
            // ruleid: auth.csharp.jwt.require-signed-tokens-disabled
            RequireSignedTokens = false,
        };
    }

    public void BuildAssignment(TokenValidationParameters parameters)
    {
        // ruleid: auth.csharp.jwt.require-signed-tokens-disabled
        parameters.RequireSignedTokens = false;
    }
}
