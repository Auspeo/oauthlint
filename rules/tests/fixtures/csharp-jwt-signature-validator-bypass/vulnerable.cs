using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;

public class Startup
{
    public TokenValidationParameters BuildExpression()
    {
        return new TokenValidationParameters
        {
            // ruleid: auth.csharp.jwt.signature-validator-bypass
            SignatureValidator = (token, parameters) => new JwtSecurityToken(token),
        };
    }

    public TokenValidationParameters BuildBlock()
    {
        return new TokenValidationParameters
        {
            // ruleid: auth.csharp.jwt.signature-validator-bypass
            SignatureValidator = (token, parameters) =>
            {
                return new JwtSecurityToken(token);
            },
        };
    }
}
