using Microsoft.AspNetCore.Mvc;

public class AccountController : Controller
{
    public IActionResult LoginCallback(string returnUrl)
    {
        // ok: local-URL check before redirecting
        if (Url.IsLocalUrl(returnUrl))
        {
            return Redirect(returnUrl);
        }
        return RedirectToAction("Index", "Home");
    }

    // ok: LocalRedirect throws on a non-local URL
    public IActionResult Safe(string returnUrl)
    {
        return LocalRedirect(returnUrl);
    }
}
