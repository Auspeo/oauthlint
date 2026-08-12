using Microsoft.IdentityModel.Tokens;

public class Startup
{
    public TokenValidationParameters BuildInitializer()
    {
        return new TokenValidationParameters
        {
            ValidateLifetime = true,
            // ruleid: auth.csharp.jwt.require-expiration-disabled
            RequireExpirationTime = false,
        };
    }

    public void BuildAssignment(TokenValidationParameters parameters)
    {
        // ruleid: auth.csharp.jwt.require-expiration-disabled
        parameters.RequireExpirationTime = false;
    }
}
