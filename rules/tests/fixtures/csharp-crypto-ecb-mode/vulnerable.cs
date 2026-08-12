using System.Security.Cryptography;

public class Crypto
{
    public byte[] Encrypt(byte[] data, byte[] key)
    {
        using var aes = Aes.Create();
        aes.Key = key;
        // ruleid: auth.csharp.crypto.ecb-mode
        aes.Mode = CipherMode.ECB;
        var enc = aes.CreateEncryptor();
        return enc.TransformFinalBlock(data, 0, data.Length);
    }
}
