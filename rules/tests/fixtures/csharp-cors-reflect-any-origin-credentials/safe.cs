using Microsoft.AspNetCore.Cors.Infrastructure;
using Microsoft.Extensions.DependencyInjection;

public class Startup
{
    public void ConfigureServices(IServiceCollection services)
    {
        services.AddCors(options =>
        {
            options.AddPolicy("trusted", builder =>
            {
                builder
                    .WithOrigins("https://app.example.com")
                    .AllowCredentials();
            });

            options.AddPolicy("publicReadOnly", builder =>
            {
                builder.AllowAnyOrigin();
            });
        });
    }
}
