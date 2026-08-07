using System.Net.Http;
using System.Net.Security;
using System.Security.Cryptography.X509Certificates;

public class HttpClientFactory
{
    public HttpClient BuildTrusted()
    {
        var handler = new HttpClientHandler();
        handler.ServerCertificateCustomValidationCallback =
            (message, cert, chain, errors) => errors == SslPolicyErrors.None;
        return new HttpClient(handler);
    }

    public HttpClient BuildDefault()
    {
        return new HttpClient(new HttpClientHandler());
    }
}
