using System.Net.Http;
using System.Net.Security;

public class HttpClientFactory
{
    public HttpClient BuildDangerous()
    {
        var handler = new HttpClientHandler();
        // ruleid: auth.csharp.tls.disable-cert-validation
        handler.ServerCertificateCustomValidationCallback =
            HttpClientHandler.DangerousAcceptAnyServerCertificateValidator;
        return new HttpClient(handler);
    }

    public HttpClient BuildAlwaysTrueLambda()
    {
        var handler = new HttpClientHandler();
        // ruleid: auth.csharp.tls.disable-cert-validation
        handler.ServerCertificateCustomValidationCallback = (message, cert, chain, errors) => true;
        return new HttpClient(handler);
    }

    public void ConfigureRemote()
    {
        // ruleid: auth.csharp.tls.disable-cert-validation
        System.Net.ServicePointManager.ServerCertificateValidationCallback = (sender, cert, chain, errors) => true;
    }

    public void ConfigureSslStream(SslClientAuthenticationOptions options)
    {
        // ruleid: auth.csharp.tls.disable-cert-validation
        options.RemoteCertificateValidationCallback = (sender, cert, chain, errors) => true;
    }
}
