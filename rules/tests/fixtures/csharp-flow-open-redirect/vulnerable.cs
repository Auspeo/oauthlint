using Microsoft.AspNetCore.Mvc;

public class AccountController : Controller
{
    public IActionResult LoginCallback(string returnUrl)
    {
        // ruleid: auth.csharp.flow.open-redirect
        return Redirect(returnUrl);
    }

    public IActionResult Back()
    {
        // ruleid: auth.csharp.flow.open-redirect
        return Redirect(Request.Query["next"]);
    }
}
