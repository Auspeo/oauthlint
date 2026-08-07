---
"oauthlint-rules": minor
"oauthlint": minor
"oauthlint-mcp": patch
---

Add a C# / ASP.NET Core rule pack: 12 low-false-positive rules for the auth mistakes AI tools generate in .NET services. Coverage: JWT bearer `TokenValidationParameters` with signature, audience, lifetime or issuer validation disabled; hard-coded symmetric signing keys and OAuth client secrets; `RequireHttpsMetadata = false`; PKCE turned off; insecure auth cookies (`CookieSecurePolicy.None`, `HttpOnly = false`); a CORS policy that reflects any origin with credentials; and disabled TLS certificate validation.

The audience, lifetime and issuer rules are anchored inside `AddJwtBearer(...)` so they fire on application configuration but stay quiet on OIDC frameworks (OpenIddict, IdentityServer) that disable those built-in checks on purpose. Validated at zero findings on `jwt-dotnet/jwt`, `openiddict/openiddict-core` and `IdentityModel/IdentityModel`.
