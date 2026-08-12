using System.Security.Cryptography;

public class Crypto
{
    public byte[] Encrypt(byte[] data, byte[] key)
    {
        using var aes = Aes.Create();
        aes.Key = key;
        // ok: CBC with a random IV
        aes.Mode = CipherMode.CBC;
        aes.GenerateIV();
        var enc = aes.CreateEncryptor();
        return enc.TransformFinalBlock(data, 0, data.Length);
    }
}
