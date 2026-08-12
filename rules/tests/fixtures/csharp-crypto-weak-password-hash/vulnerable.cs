using System.Security.Cryptography;
using System.Text;

public class Accounts
{
    public byte[] HashPassword(string password)
    {
        // ruleid: auth.csharp.crypto.weak-password-hash
        return SHA256.HashData(Encoding.UTF8.GetBytes(password));
    }

    public byte[] LegacyHash(string password)
    {
        // ruleid: auth.csharp.crypto.weak-password-hash
        return MD5.HashData(Encoding.UTF8.GetBytes(password));
    }
}
