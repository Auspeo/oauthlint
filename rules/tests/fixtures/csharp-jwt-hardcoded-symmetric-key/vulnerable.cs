using System.Text;
using Microsoft.IdentityModel.Tokens;

public class TokenService
{
    public SecurityKey BuildUtf8Key()
    {
        // ruleid: auth.csharp.jwt.hardcoded-symmetric-key
        return new SymmetricSecurityKey(Encoding.UTF8.GetBytes("s3cr3t-signing-key-value-9a8b7c"));
    }

    public SecurityKey BuildAsciiKey()
    {
        // ruleid: auth.csharp.jwt.hardcoded-symmetric-key
        return new SymmetricSecurityKey(Encoding.ASCII.GetBytes("another-hardcoded-secret-01234"));
    }
}
