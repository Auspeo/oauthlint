using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.JsonWebTokens;

public class TokenReader
{
    public string GetUserId(string incomingToken)
    {
        // ruleid: auth.csharp.jwt.read-without-validation
        var parsed = new JwtSecurityToken(incomingToken);
        return parsed.Subject;
    }

    public string GetIssuer(string incomingToken)
    {
        var handler = new JwtSecurityTokenHandler();
        // ruleid: auth.csharp.jwt.read-without-validation
        var jwt = handler.ReadJwtToken(incomingToken);
        return jwt.Issuer;
    }

    public string GetAudience(string incomingToken)
    {
        // ruleid: auth.csharp.jwt.read-without-validation
        var jwt = new JsonWebToken(incomingToken);
        return jwt.Audiences.ToString();
    }
}
