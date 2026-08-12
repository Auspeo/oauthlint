using System;

public class TokenService
{
    public string GenerateResetToken()
    {
        // ruleid: auth.csharp.crypto.insecure-random
        return new Random().Next(100000, 999999).ToString();
    }

    public string CreateApiKey()
    {
        // ruleid: auth.csharp.crypto.insecure-random
        return Guid.NewGuid().ToString("N");
    }
}
