using Microsoft.AspNetCore.Builder;

public class Program
{
    public static void Configure(WebApplication app)
    {
        app.UseRouting();
        // ruleid: auth.csharp.web.authentication-after-authorization
        app.UseAuthorization();
        app.UseAuthentication();
        app.MapControllers();
    }
}
