using Microsoft.AspNetCore.Builder;

public class Program
{
    // Correct order: authentication runs before authorization.
    public static void Configure(WebApplication app)
    {
        app.UseRouting();
        app.UseAuthentication();
        app.UseAuthorization();
        app.MapControllers();
    }
}
