using Microsoft.AspNetCore.Identity;
using System.Security.Cryptography;
using System.Text;

public class Accounts
{
    private readonly PasswordHasher<object> _hasher = new();

    public string HashPassword(object user, string password)
    {
        // ok: dedicated slow, salted password hasher
        return _hasher.HashPassword(user, password);
    }

    // ok: SHA256 over a file, not a password
    public byte[] Checksum(byte[] fileBytes)
    {
        return SHA256.HashData(fileBytes);
    }
}
