---
"oauthlint-rules": minor
---

Add seven Java rules covering OAuth, JWT, Spring Security, and CORS
anti-patterns that LLM-generated code commonly introduces:

- `auth.java.oauth.ropc-grant` — Resource Owner Password Credentials grant
  (`grant_type=password`) in a token-request body (CWE-522).
- `auth.java.oauth.insecure-token-endpoint` — cleartext `http://` OAuth/OIDC
  authorize/token endpoint, excluding localhost and loopback (CWE-319).
- `auth.java.oauth.static-state` — hardcoded constant `state` in an authorize
  URL, which provides no CSRF protection (CWE-330).
- `auth.java.jwt.untrusted-verify-key` — taint rule: request input flowing into
  the JWT verification key (jjwt `setSigningKey`/`verifyWith`, Nimbus
  `MACVerifier`) (CWE-347).
- `auth.java.jwt.none-algorithm` — the unsecured `none` algorithm in jjwt
  (`SignatureAlgorithm.NONE`) or Auth0 java-jwt (`Algorithm.none()`) (CWE-347).
- `auth.java.web.permit-all-actuator` — Spring Security `permitAll()` on a
  sensitive management/diagnostics path such as `/actuator/**` (CWE-862).
- `auth.java.cors.credentialed-wildcard` — a wildcard CORS origin combined with
  credentials, including the `addAllowedOriginPattern("*")` API (CWE-942).

Each rule ships annotated `vulnerable.java` / `safe.java` fixtures enforced by
the fixture harness.
