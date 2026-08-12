using System.Text;
using Microsoft.IdentityModel.Tokens;

public class Startup
{
    // No SignatureValidator override: the handler verifies the signature against
    // the configured signing key. This must not fire.
    public TokenValidationParameters Build(string keyMaterial)
    {
        return new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyMaterial)),
            ValidateIssuer = true,
            ValidIssuer = "https://issuer.example.com",
        };
    }
}
