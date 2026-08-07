using Microsoft.AspNetCore.Cors.Infrastructure;
using Microsoft.Extensions.DependencyInjection;

public class Startup
{
    public void ConfigureServices(IServiceCollection services)
    {
        services.AddCors(options =>
        {
            options.AddPolicy("reflectAllowed", builder =>
            {
                // ruleid: auth.csharp.cors.reflect-any-origin-credentials
                builder.SetIsOriginAllowed(origin => true).AllowCredentials();
            });

            options.AddPolicy("credentialsReflect", builder =>
            {
                // ruleid: auth.csharp.cors.reflect-any-origin-credentials
                builder.AllowCredentials().SetIsOriginAllowed(origin => true);
            });

            options.AddPolicy("anyOrigin", builder =>
            {
                // ruleid: auth.csharp.cors.reflect-any-origin-credentials
                builder.AllowAnyOrigin().AllowCredentials();
            });

            options.AddPolicy("credentialsAny", builder =>
            {
                // ruleid: auth.csharp.cors.reflect-any-origin-credentials
                builder.AllowCredentials().AllowAnyOrigin();
            });
        });
    }
}
