using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;

public class TokenReader
{
    // Claims are read from a VALIDATED token, not a raw parse.
    public string GetUserId(string incomingToken, TokenValidationParameters parameters)
    {
        var handler = new JwtSecurityTokenHandler();
        ClaimsPrincipal principal = handler.ValidateToken(incomingToken, parameters, out SecurityToken validated);
        return principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    }

    // Multi-argument constructor CREATES a token we are about to sign/issue — this
    // is not a decode-and-trust of an incoming token, so it must not fire.
    public JwtSecurityToken Issue(string issuer, string audience, SigningCredentials creds)
    {
        return new JwtSecurityToken(issuer, audience, null, DateTime.UtcNow, DateTime.UtcNow.AddMinutes(5), creds);
    }
}
