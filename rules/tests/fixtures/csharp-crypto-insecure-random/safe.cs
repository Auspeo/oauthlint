using System;
using System.Security.Cryptography;

public class TokenService
{
    public string GenerateResetToken()
    {
        // ok: cryptographically secure RNG
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToBase64String(bytes);
    }

    // ok: Random used for a non-security purpose in a non-security method
    public int RollDice()
    {
        return new Random().Next(1, 6);
    }
}
