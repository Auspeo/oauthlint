# oauthlint-rules

## 0.2.6

### Patch Changes

- 267d3e9: feat(rules): JWT algorithm-confusion detection for Python and Rust

  `auth.py.jwt.algorithm-confusion` (PyJWT) and `auth.rust.jwt.algorithm-confusion` (jsonwebtoken)
  flag an `algorithms` allowlist that mixes a symmetric (HS*) with an asymmetric (RS*/ES*/PS*) family
  — the classic key-confusion forgery (CWE-327). Parity with the JS/TS rule.

- 8abda65: feat(rules): dataflow (taint-mode) secret-in-response detection — JS/TS, Python, Go

  Trace a server secret (an env value whose name looks like a credential) into an HTTP response body
  (CWE-200 / OWASP API3:2023) — i.e. the server leaking its own secrets to the client. `auth.flow.secret-in-response`
  (Express), `auth.py.flow.secret-in-response` (Flask), `auth.go.flow.secret-in-response` (net/http). Deliberately
  client-public vars (`NEXT_PUBLIC_`/`PUBLIC_`/`VITE_`/…) are excluded to stay low-FP.

## 0.2.5

### Patch Changes

- a8d7db8: feat(rules): dataflow (taint-mode) open-redirect detection — JS/TS, Python, Go

  The pack's first taint-mode rules: they trace untrusted request input to a redirect sink
  (open redirect, CWE-601), a top OAuth threat. `auth.flow.open-redirect` (Express),
  `auth.py.flow.open-redirect` (Flask), `auth.go.flow.open-redirect` (net/http). Allow-list /
  `url_for` / validation sanitizers keep them low-FP.

- f6e6da2: feat(rules): dataflow (taint-mode) SSRF detection — JS/TS, Python, Go

  Trace untrusted request input into an outbound HTTP request URL (Server-Side Request Forgery,
  CWE-918 / OWASP API7:2023) — the path that lets an attacker reach internal services or the cloud
  metadata endpoint to steal IAM credentials. `auth.flow.ssrf` (fetch/axios/http), `auth.py.flow.ssrf`
  (requests/httpx/urllib), `auth.go.flow.ssrf` (net/http). Allow-list / host-validation sanitizers keep them low-FP.

## 0.2.4

### Patch Changes

- fe253ca: feat(rules): 3 new rules (→ 100) + expand safe autofixes

  - `auth.oauth.access-token-in-url` (JS/TS, CWE-598) — OAuth token in a URL query string.
  - `auth.rust.jwt.no-issuer-validation` (Rust/jsonwebtoken, CWE-345) — decode without validating `iss`.
  - `auth.java.crypto.weak-hash` (Java, CWE-328) — `MessageDigest` with MD5/SHA-1.
  - Added safe `--fix` autofixes to `auth.rust.tls.accept-invalid-certs` and
    `auth.rust.tls.accept-invalid-hostnames` (`true` → `false`).

## 0.2.3

### Patch Changes

- 782d1c0: feat(rules): add 3 rules — OAuth tokens in web storage, Go skipped claims, Flask-CORS

  - `auth.oauth.token-in-localstorage` (JS/TS, CWE-922) — OAuth/OIDC tokens stored in
    localStorage/sessionStorage (XSS-exfiltratable).
  - `auth.go.jwt.skip-claims-validation` (Go/golang-jwt, CWE-613) — parsing with
    `jwt.WithoutClaimsValidation()` (skips expiry/claims checks).
  - `auth.py.cors.allow-all` (Python/Flask-CORS, CWE-942) — wildcard origin together
    with `supports_credentials=True`.

- d2465c7: feat(rules): add 4 rules for common AI-generated auth mistakes

  - `auth.tls.reject-unauthorized` (JS/TS, CWE-295) — disabling Node TLS certificate
    validation (`rejectUnauthorized: false` / `NODE_TLS_REJECT_UNAUTHORIZED=0`).
  - `auth.jwt.ignore-expiration` (JS/TS, CWE-613) — `jwt.verify(…, { ignoreExpiration: true })`.
  - `auth.cookie.samesite-none-insecure` (JS/TS, CWE-1275) — `SameSite=None` cookie without `Secure`.
  - `auth.py.jwt.no-expiration` (Python/PyJWT, CWE-613) — `options={"verify_exp": False}`.

## 0.2.2

### Patch Changes

- chore: attribute the project to Auspeo instead of a personal name (LICENSE,
  package `author`, README bylines) and stop freezing the rule/language counts in
  prose ("90 rules", "five languages") so the copy doesn't go stale as coverage
  grows — counts now live only in the always-current rule catalogue.

## 0.2.1

### Patch Changes

- 2e79ca4: fix(rules): eliminate two false positives surfaced by hand-verifying the
  AI-codegen benchmark.

  - `auth.oauth.no-state-validation` no longer fires when `state` is read into a
    local variable and validated afterwards
    (`const state = url.searchParams.get('state'); ...; if (expected !== state)`).
    The rule previously only recognized validation done inline inside the `if`.
  - `auth.cors.reflect-origin` no longer fires on an allowlist callback that gates
    `cb(null, true)` behind an origin check (`if (allow.has(origin)) cb(null, true)`)
    — the exact safe shape the rule's own message recommends. It now flags only
    block/function callbacks that ignore their origin argument and allow
    unconditionally. New vulnerable + safe fixtures lock in both shapes.

- 768f0aa: fix(rules): `auth.jwt.localstorage` now catches token-named values, not just
  token-named string-literal keys. The common shape
  `localStorage.setItem(TOKEN_KEY, token)` — where the storage key is a variable —
  was previously missed. Surfaced by the AI-codegen benchmark; validated to still
  fire 0 on the clean JS auth libraries.

## 0.2.0

### Minor Changes

- 840268c: feat(rules): Go rule packs. The language-aware infrastructure now also covers
  Go — `.go` fixtures, `auth.go.<category>.<name>` ids, and `go` doc fences —
  with zero change to JS/TS or Python rules. Ships the first Go rule,
  `auth.go.tls.insecure-skip-verify` (crypto/tls `InsecureSkipVerify: true`,
  CWE-295).
- 038b77b: feat(rules): Java rule packs. The language-aware infrastructure now also covers
  Java — `.java` fixtures, `auth.java.<category>.<name>` ids, and `java` doc
  fences — with zero change to existing JS/TS, Python, or Go rules. Ships the
  first Java rule, `auth.java.web.csrf-disabled` (Spring Security
  `csrf().disable()`, CWE-352).
- 05eea03: feat(rules): multi-language support — Python rule packs. The rule schema, the
  loader/fixture contract, and the docs generator now understand a language
  segment (`auth.<lang>.<category>.<name>`, e.g. `auth.py.jwt.no-verify`) and
  `.py` fixtures, with zero change to existing JS/TS rule ids or doc URLs. Ships
  the first Python rule, `auth.py.jwt.no-verify` (PyJWT signature verification
  disabled, CWE-347).
- b3ccff7: Add `auth.cors.null-origin` (AUTH-CORS-003, CWE-942). Flags CORS policies that
  allow the literal origin `'null'` — `res.setHeader('Access-Control-Allow-Origin', 'null')`,
  `cors({ origin: 'null' })`, and allowlists containing `'null'` (inline array or
  an indirected array variable). Sandboxed iframes, `file://` documents, and some
  cross-origin redirects send `Origin: null`, so allowing the `'null'` string
  grants cross-origin access to attacker-controlled contexts and defeats the
  same-origin policy. Matches only the literal string `'null'`/`"null"`, never the
  `null` keyword or real origins. Complements `auth.cors.wildcard-with-credentials`
  (literal `*`) and `auth.cors.reflect-origin` (dynamic reflection).
- 1941d79: Add `auth.cors.reflect-origin` (AUTH-CORS-002, CWE-942). Flags CORS policies
  that echo the request's `Origin` back as `Access-Control-Allow-Origin` —
  `res.setHeader('Access-Control-Allow-Origin', req.headers.origin)`,
  `cors({ origin: true })`, and callbacks that unconditionally `cb(null, true)`.
  Dynamic origin reflection is equivalent to allowing every origin and, with
  credentials, becomes a CSRF/account-takeover primitive. Complements
  `auth.cors.wildcard-with-credentials` (which targets literal `*`); this rule
  targets dynamic reflection. Explicit string/array/regex allowlists are not
  flagged.
- b3ccff7: feat(rules): add `auth.flow.credentials-in-url` (AUTH-FLOW-009, CWE-598). Flags
  a secret credential placed in a URL query string — `password`, `access_token`,
  `client_secret`, `api_key`, `apikey`, or `secret` — built as a string/template
  URL (`'/login?password=' + pw`, `` `?access_token=${t}` ``) or via
  `URLSearchParams` `.set(...)` / `.append(...)`. Credentials in URLs leak through
  server logs, browser history, and the `Referer` header (OWASP API2:2023,
  llm-prevalence HIGH). Deliberately narrow to avoid false positives: it does NOT
  flag the OAuth authorization `code`, `state`, or email `reset_token`/`verify_token`
  links, nor the generic word `token` (only `access_token`), nor credentials sent
  in a POST body or `Authorization` header.
- 6e8510d: Add `auth.py.flow.csrf-exempt` (AUTH-PY-FLOW-005, CWE-352). Flags Django views
  that disable CSRF protection via the `@csrf_exempt` decorator or
  `@method_decorator(csrf_exempt, ...)` on a class-based view, which exposes the
  endpoint to cross-site request forgery. Keep the default protection and, for
  webhooks, validate a request signature instead. Scoped to the applied
  decorator; a bare `import csrf_exempt` or an unrelated decorator is not matched.
- b3ccff7: Add `auth.flow.secret-in-log` (AUTH-FLOW-008, CWE-532). Flags secret-shaped
  identifiers (`password`, `token`, `secret`, `apiKey`, `accessToken`,
  `refreshToken`, `privateKey`, `clientSecret`, …) passed to a logging call —
  `console.log/info/debug/warn/error(...)` or `logger.<level>(...)` — including
  when the secret is at any argument position or interpolated into a template
  literal (`console.log(\`token=${token}\`)`). Logs leak to files and
aggregators, so this is a textbook credential disclosure. To keep false
positives low the rule only fires on bare secret-named identifiers: string
literals (`console.log('password updated')`, `console.log('reset token sent')`),
non-secret member access (`console.log(user.id)`) and plain status text
(`console.log('login ok')`) are not flagged.
- 840268c: Add `auth.go.cookie.insecure` (AUTH-GO-COOKIE-001): flags session/auth
  `http.Cookie` values created with a security attribute explicitly disabled —
  `http.Cookie{..., Secure: false, ...}` and `http.Cookie{..., HttpOnly: false, ...}`.
  With `Secure: false` the cookie travels over plain HTTP; with `HttpOnly: false`
  it is readable from JavaScript — either way the session/token cookie can be
  stolen (CWE-614, OWASP A05:2021). Only the literal `false` is matched;
  `Secure: true`, `HttpOnly: true`, and the absence of the field are not flagged.
  Works for both `http.Cookie{...}` and `&http.Cookie{...}`.
- 374d89d: Add `auth.go.cors.allow-all` (AUTH-GO-CORS-001, CWE-942). Flags Go CORS
  configurations that allow every origin via the wildcard `*`: gin-contrib/cors
  `cors.Config{..., AllowAllOrigins: true, ...}`, rs/cors `cors.Options{...,
AllowedOrigins: []string{"*"}, ...}` (any list literal containing `"*"`), and
  the raw header `w.Header().Set("Access-Control-Allow-Origin", "*")`. Allowing
  all origins defeats the same-origin policy and, combined with credentials,
  becomes an account-takeover primitive that leaks OAuth/OIDC tokens. Only the
  wildcard / `AllowAllOrigins: true` is matched — explicit origins such as
  `"https://app.example.com"` are not flagged.
- 374d89d: Add `auth.go.crypto.bcrypt-low-cost` (AUTH-GO-CRYPTO-002, CWE-916). Flags Go
  code that calls `bcrypt.GenerateFromPassword` (from `golang.org/x/crypto/bcrypt`)
  with a numeric cost literal below 10. A low bcrypt work factor makes each hash
  cheap to compute, letting an attacker brute-force stolen password hashes far
  too quickly; OWASP recommends a cost of at least 10 and ≥ 12 for new
  applications. To keep false positives low, a `metavariable-comparison`
  constrains the match to numeric literals < 10, so `bcrypt.DefaultCost`, a cost
  ≥ 10, and a cost passed via a variable are not flagged.
- 374d89d: Add `auth.go.crypto.weak-cipher` (AUTH-GO-CRYPTO-003, CWE-327). Flags use of
  broken or deprecated ciphers to protect sensitive data: DES
  (`des.NewCipher`), 3DES (`des.NewTripleDESCipher`), and RC4 (`rc4.NewCipher`).
  These have 64-bit blocks (Sweet32) or known keystream biases (RFC 7465) and
  leave tokens and secrets inadequately protected. Use authenticated AES-GCM
  instead (`aes.NewCipher` + `cipher.NewGCM`); `aes.NewCipher` is not flagged.
- 374d89d: Add `auth.go.crypto.weak-password-hash` (AUTH-GO-CRYPTO-001, CWE-916). Flags
  passwords hashed with a fast, general-purpose digest from the Go standard
  library — `md5.Sum`, `sha1.Sum`, `sha256.Sum256`, `sha512.Sum512`, and the
  streaming `h := md5.New(); h.Write([]byte(password))` writer form. Fast digests
  make offline brute-force and rainbow-table attacks cheap and are unsuitable for
  password storage. The rule is anchored to the "password" character of the
  hashed argument (metavariable-regex), so file checksums such as
  `sha256.Sum256(fileBytes)` are not flagged, and proper password hashers
  (`bcrypt`, `argon2`, `scrypt`) are recommended instead.
- 840268c: Add `auth.go.flow.weak-rand` (AUTH-GO-FLOW-001, CWE-330). Flags Go code that
  generates a security-sensitive value with the `math/rand` package instead of
  `crypto/rand`. The rule matches the math/rand-exclusive generators
  (`rand.Intn`, `rand.Int`, `rand.Int31`, `rand.Int63`, `rand.Float64`,
  `rand.Perm`) when their result is assigned (`:=` or `=`) to an identifier
  whose name looks like a secret (`token`, `secret`, `key`, `password`, `nonce`,
  `otp`, `salt`). `math/rand` is a deterministic PRNG, so any credential derived
  from it is predictable; `crypto/rand` (`rand.Read`) is the correct source.
  To keep false positives low, `rand.Read` is never flagged (it also exists in
  `crypto/rand`, the safe path) and non-secret uses such as `i := rand.Intn(10)`
  loop indices or `delay := rand.Intn(500)` backoff jitter are ignored.
- 840268c: Add `auth.go.jwt.hardcoded-secret` (AUTH-GO-JWT-003, CWE-798). Flags golang-jwt
  HMAC keys that are hardcoded as string literals: `token.SignedString([]byte("literal"))`
  and a `Keyfunc` (`func(...) (interface{}, error)`) that returns
  `[]byte("literal"), nil`. Anyone who can read the source or git history can
  forge tokens, an authentication bypass. Load the key from the environment or a
  secret manager instead. The `"..."` literal must sit in key position, so
  `[]byte(os.Getenv("JWT_SECRET"))` and `[]byte(secret)` (a variable) are not
  matched.
- 840268c: Add `auth.go.jwt.none-algorithm` (AUTH-GO-JWT-001, CWE-347). Flags use of the
  golang-jwt `none` algorithm, which produces an unsigned, forgeable token — a
  complete authentication bypass. Matches `jwt.SigningMethodNone` (e.g. via
  `jwt.NewWithClaims(jwt.SigningMethodNone, ...)`) and the
  `jwt.UnsafeAllowNoneSignatureType` sentinel passed to `SignedString`. Sign with
  `jwt.SigningMethodHS256`/`RS256`/`ES256` instead; those real algorithms are not
  flagged.
- 840268c: Add `auth.go.jwt.parse-unverified` (AUTH-GO-JWT-002, CWE-347). Flags golang-jwt
  calls that decode a token with `ParseUnverified` — `parser.ParseUnverified(...)`,
  `jwt.NewParser().ParseUnverified(...)`, `new(jwt.Parser).ParseUnverified(...)` —
  which parse the JWT without checking its signature, so any claims read from the
  result are attacker-controlled (authentication bypass). Verify instead with
  `jwt.Parse(tok, keyfunc)` or `jwt.ParseWithClaims(tok, claims, keyfunc)`. The
  signature-verifying `jwt.Parse` / `jwt.ParseWithClaims` calls are not matched.
- 374d89d: feat(rules): add `auth.go.jwt.unchecked-method` (AUTH-GO-JWT-004). Flags a
  golang-jwt `Keyfunc` passed to `jwt.Parse`/`jwt.ParseWithClaims` that returns
  the verification key without first checking `token.Method` (the signing
  algorithm). Skipping this check enables an algorithm-confusion attack: a server
  that verifies RS256 tokens with an RSA public key will accept an HS256 token
  forged with that public key used as the HMAC secret, bypassing authentication
  (CWE-347, OWASP API2:2023). A keyfunc that asserts the method first
  (`t.Method.(*jwt.SigningMethodHMAC)` or a comparison such as
  `t.Method != jwt.SigningMethodHS256`) before returning the key is not flagged.
- 374d89d: feat(rules): add `auth.go.tls.min-version` (AUTH-GO-TLS-002). Flags a
  `tls.Config` whose `MinVersion` is pinned to an obsolete protocol
  (`tls.VersionSSL30`, `tls.VersionTLS10`, or `tls.VersionTLS11`), which exposes
  OAuth/OIDC traffic to downgrade attacks (POODLE, BEAST). Requires at least
  `tls.VersionTLS12`. CWE-326, OWASP A02:2021.
- 038b77b: Add `auth.java.cookie.insecure` (AUTH-JAVA-COOKIE-001): flags a servlet
  `Cookie` whose security attribute is explicitly disabled — `setSecure(false)`
  or `setHttpOnly(false)`. With `setSecure(false)` the cookie travels over plain
  HTTP; with `setHttpOnly(false)` it is readable from JavaScript — either way a
  session or auth cookie can be stolen (CWE-614, OWASP A05:2021). Only the literal
  `false` argument is matched; `setSecure(true)`, `setHttpOnly(true)`, and the
  absence of the call are not flagged. Works on any `jakarta`/`javax` servlet
  `Cookie` instance.
- f02218d: Add `auth.java.cors.allow-all` (AUTH-JAVA-CORS-001, CWE-942). Flags Spring CORS
  configurations that allow every origin via the wildcard `*`: the
  `@CrossOrigin(origins = "*")` annotation, its value alias `@CrossOrigin("*")`,
  a bare `@CrossOrigin` on a handler method (defaults to all origins), and the
  programmatic `CorsConfiguration` API — `addAllowedOrigin("*")` and
  `setAllowedOrigins(...)` with a list literal containing `"*"` (`List.of("*")`,
  `Arrays.asList("*")`, ...). Allowing all origins defeats the same-origin policy
  and, combined with credentials, becomes an account-takeover primitive. Only the
  literal `"*"` is matched — explicit origins such as
  `"https://app.example.com"` are not flagged.
- f02218d: feat(rules): add `auth.java.crypto.ecb-mode` (AUTH-JAVA-CRYPTO-003).
  Flags JCA `Cipher.getInstance(...)` calls that use ECB mode or a bare cipher
  alias that defaults to ECB — `"AES/ECB/..."` (any padding), `"AES"`, `"DES"`,
  `"DESede"`, `"Blowfish"` (CWE-327). ECB is deterministic and leaks plaintext
  structure. A `metavariable-regex` scopes matching to symmetric block ciphers,
  so authenticated/CBC transforms (`"AES/GCM/NoPadding"`, `"AES/CBC/PKCS5Padding"`)
  and asymmetric `"RSA/ECB/OAEPWith..."` are not flagged.
- 038b77b: feat(rules): add `auth.java.crypto.insecure-random` (AUTH-JAVA-CRYPTO-002).
  Flags security-sensitive values (token, secret, key, password, nonce, OTP,
  salt) generated with a non-cryptographic PRNG — `new java.util.Random().nextInt/
nextLong/...`, `Math.random()`, or a `Random.nextBytes(buf)` filling a secret
  buffer (CWE-330). Anchored on the target's name so non-secret uses
  (`new Random().nextInt(10)` for an index or jitter) and `SecureRandom` are not
  flagged.
- 038b77b: Add `auth.java.crypto.weak-password-hash` (AUTH-JAVA-CRYPTO-001, CWE-916).
  Flags passwords hashed with a fast JCA `MessageDigest` (MD5, SHA-1, SHA-256,
  SHA-512) — e.g. `md.digest(password.getBytes())` / `md.update(pwd...)` where a
  weak `MessageDigest.getInstance(...)` is instantiated in the same method. Fast
  general-purpose digests make offline brute-force and rainbow-table attacks
  cheap and are unsuitable for password storage. The rule is anchored to the
  "password" character of the digested argument (metavariable-regex), so file
  checksums and non-password fingerprints such as
  `MessageDigest.getInstance("SHA-256").digest(fileBytes)` are not flagged, and
  proper password hashers (`BCryptPasswordEncoder`, `Argon2PasswordEncoder`,
  PBKDF2) are recommended instead.
- f02218d: Add `auth.java.jwt.hardcoded-secret` (AUTH-JAVA-JWT-002, CWE-798). Flags jjwt
  (io.jsonwebtoken) signing keys hard-coded as string literals —
  `Keys.hmacShaKeyFor("literal".getBytes(...))`, the legacy
  `signWith(SignatureAlgorithm.HS256, "literal")`, and
  `setSigningKey("literal")` / `setSigningKey("literal".getBytes(...))` on the
  parser side. A committed signing key lets anyone with source, build, or VCS
  access forge valid tokens. Matches only string literals in a key position;
  variables, `System.getenv(...)`, and loaded `Key`/`SecretKey` values are not
  flagged. Complements `auth.java.jwt.unsigned-jwt` (AUTH-JAVA-JWT-001).
- 038b77b: Add `auth.java.jwt.unsigned-jwt` (AUTH-JAVA-JWT-001, CWE-347). Flags JWTs that
  are created or parsed without a signature, so their claims are forgeable. Matches
  nimbus-jose-jwt's unsecured `new PlainJWT(...)` and jjwt's unsigned parsing
  (`parseClaimsJwt` / `parsePlaintextJwt`). Sign and verify instead: use
  nimbus `SignedJWT`, or jjwt `Jwts.builder()...signWith(key)` parsed with
  `parseSignedClaims` / `parseClaimsJws` — those signed APIs are not flagged.
- f02218d: Add `auth.java.session.fixation-disabled` (AUTH-JAVA-SESSION-001, CWE-384).
  Flags Spring Security configurations that disable session fixation protection
  via `sessionFixation().none()` — both the legacy fluent form
  (`sessionManagement().sessionFixation().none()`) and the Spring Security 6
  lambda DSL (`sessionManagement(s -> s.sessionFixation(f -> f.none()))`). With
  `none()`, the session ID is not regenerated on authentication, so an attacker
  who fixes the session ID before login can hijack the authenticated session
  (session fixation, A07:2021). Targets only `none()`; never flags the safe
  alternatives `changeSessionId()` (the default) or `migrateSession()`.
- f02218d: feat(rules): add `auth.java.tls.trust-all-certs` (AUTH-JAVA-TLS-001). Flags
  disabled TLS hostname verification: a `HostnameVerifier` lambda that always
  returns `true` (`(host, session) -> true`), an anonymous `HostnameVerifier`
  whose `verify(...)` just returns `true`, and Apache HttpClient's
  `NoopHostnameVerifier` (constructor or `INSTANCE`). A permissive verifier
  accepts any certificate regardless of the host it was issued for, enabling
  man-in-the-middle attacks (CWE-295, OWASP A02:2021). A verifier with real
  hostname-matching logic and the default verification (no `setHostnameVerifier`
  call) are not flagged.
- f02218d: Add `auth.java.web.frame-options-disabled` (AUTH-JAVA-WEB-003, CWE-1021). Flags
  Spring Security configurations that disable the `X-Frame-Options` clickjacking
  header — the legacy fluent form (`http.headers().frameOptions().disable()`), the
  Spring Security 6 lambda DSL (`http.headers(h -> h.frameOptions(f -> f.disable()))`),
  and the method reference (`frameOptions(FrameOptionsConfig::disable)`). With the
  header off, an attacker can frame the application in a hidden `<iframe>` and
  trick a logged-in victim into clicking invisible UI. Only the `disable` terminal
  is flagged; legitimate `frameOptions(f -> f.sameOrigin())` and
  `frameOptions(f -> f.deny())` configurations are never flagged.
- 038b77b: Add `auth.java.web.permit-all` (AUTH-JAVA-WEB-002, CWE-862). Flags Spring
  Security configurations that authorize every request without authentication
  via `anyRequest().permitAll()` — both the Spring Security 6 lambda DSL
  (`authorizeHttpRequests(auth -> auth.anyRequest().permitAll())`) and the legacy
  fluent chains (`authorizeHttpRequests().anyRequest().permitAll()`,
  `authorizeRequests().anyRequest().permitAll()`). Because `anyRequest()` is the
  catch-all matcher, this makes the entire application publicly reachable (broken
  access control). Targets only the catch-all `anyRequest().permitAll()`; never
  flags `permitAll()` on specific matchers such as
  `requestMatchers("/public/**").permitAll()`, which are legitimate.
- 1941d79: Add `auth.jwt.decode-without-verify` (AUTH-JWT-009, CWE-347). Flags
  `jwt.decode(...)` from `jsonwebtoken`, which parses a token without verifying
  its signature — trusting the returned claims is an authentication bypass. Use
  `jwt.verify(token, secret)` instead. Scoped to the `jwt` alias and the
  destructured `decode` import; `jwt.verify(...)`, `jose.decodeJwt`, and unrelated
  `decode()` calls are not matched.
- b3ccff7: Add `auth.jwt.no-algorithms-allowlist` (AUTH-JWT-010, CWE-347). Flags
  `jwt.verify(...)` from `jsonwebtoken` called without an explicit `algorithms`
  allowlist — accepting any algorithm enables algorithm-confusion attacks (and
  `alg: none` on older versions). Always pass `{ algorithms: ['RS256'] }` (or the
  algorithm you expect). Scoped to the `jwt` alias; `jwt.verify` calls that
  already pin `algorithms`, as well as `jwt.sign`, `jwt.decode`, and
  `jose.jwtVerify`, are not matched.
- 1941d79: feat(rules): add `auth.oauth.no-nonce` (AUTH-OAUTH-010). Flags an OIDC
  authorization request (scope contains `openid`) built without a `nonce`
  parameter. The nonce binds the id_token to the request (OIDC Core §3.1.2.1) —
  its absence enables id_token replay/substitution (CWE-294). Detects both inline
  authorize-URL strings and programmatic `URLSearchParams` builds. Does not fire
  on pure OAuth flows (no `openid` scope) or when a nonce is already present.
- b3ccff7: feat(rules): add `auth.oauth.pkce-plain` (AUTH-OAUTH-011). Flags PKCE
  configured with `code_challenge_method=plain` instead of `S256`. The `plain`
  method sends the `code_verifier` verbatim as the `code_challenge`, so PKCE
  offers no protection against authorization-code interception (CWE-757). Detects
  the query-string form (inline authorize URL / template fragment), object
  literals `{ code_challenge_method: 'plain' }`, and `URLSearchParams`
  `.set()`/`.append()` calls. Matches only the literal `plain` value, never
  `S256`.
- 6e8510d: Add `auth.py.cookie.insecure-flags` (AUTH-PY-COOKIE-001): flags session/auth
  cookies issued with a security attribute explicitly disabled —
  `response.set_cookie(..., secure=False)`, `response.set_cookie(..., httponly=False)`,
  and Django settings `SESSION_COOKIE_SECURE = False`, `CSRF_COOKIE_SECURE = False`,
  `SESSION_COOKIE_HTTPONLY = False`. These let auth cookies travel over plain HTTP
  or be read by JavaScript, exposing the session token to theft (CWE-614,
  OWASP A05:2021). Only the literal `False` is matched; `secure=True`,
  `SESSION_COOKIE_SECURE = True`, and the absence of the kwarg are not flagged.
- 6e8510d: Add `auth.py.flow.debug-enabled` (AUTH-PY-FLOW-003, CWE-489). Flags debug mode
  hard-coded to `True` in Flask and Django apps — `app.run(..., debug=True)`,
  `app.config["DEBUG"] = True`, `app.debug = True`, and Django's `DEBUG = True`
  setting. In production this leaks the `SECRET_KEY`, environment variables, and
  tracebacks, and Flask's Werkzeug debugger exposes an interactive console
  (remote code execution). Drive debug from an environment variable that defaults
  to off instead. Matches only the literal `True`; `debug=False`, `DEBUG = False`,
  and `os.environ.get(...)` / `config(...)` assignments are not flagged.
- 6e8510d: Add rule `auth.py.flow.insecure-random-token` (AUTH-PY-FLOW-004, CWE-330): flags
  security-sensitive values (token, secret, password, OTP, nonce, API key,
  reset/verification code) generated with the non-cryptographic `random` module
  (`random.random()`, `randint`, `choice`, `choices`, `getrandbits`,
  `"".join(random.choice(...) for ...)`), and recommends `secrets`
  (`token_urlsafe`/`token_hex`/`choice`) or `os.urandom`. Anchored on the
  secret-named assignment target via `metavariable-regex` to avoid false positives
  on non-security uses of `random` (jitter, sampling, colors) and never matches
  `secrets.*` or `os.urandom`.
- 05eea03: Add `auth.py.flow.requests-verify-disabled` (AUTH-PY-FLOW-002, CWE-295). Flags
  Python `requests` calls that disable TLS certificate verification with
  `verify=False` — `requests.get/post/put/delete/patch/head/options/request(...)`
  as well as `Session` calls (`$SESSION.get(..., verify=False)`, etc.). Disabling
  verification opens OAuth/OIDC token and secret exchanges to man-in-the-middle
  attacks. To keep false positives low the rule fires only on the literal
  `verify=False`; `verify=True`, a custom CA bundle path
  (`verify="/etc/ssl/ca.pem"`) and the absence of `verify` are not flagged.
- 05eea03: Add rule `auth.py.flow.weak-password-hash` (AUTH-PY-FLOW-001, CWE-916): flags
  passwords hashed with fast/broken `hashlib` digests (`md5`/`sha1`/`sha256`/`sha512`),
  including the `h = hashlib.sha256(); h.update(password)` form and
  `password.encode()` arguments, and recommends bcrypt/argon2 (argon2-cffi)/passlib/scrypt.
  Anchored on a password-named argument to avoid false positives on file/content
  checksums (`hashlib.sha256(file_bytes)`), HMAC signatures, and real password hashers.
- 05eea03: Add `auth.py.jwt.alg-none` (AUTH-PY-JWT-002, CWE-347). Flags PyJWT calls that
  accept or issue tokens with the `none` algorithm — `jwt.decode(...,
algorithms=[..., "none", ...])` and `jwt.encode(..., algorithm="none")` —
  where the token is not cryptographically signed, allowing an attacker to forge
  arbitrary claims (authentication bypass). Pin a strong algorithm instead:
  `algorithms=["RS256"]` / `algorithm="HS256"`. Scoped to the `jwt.` alias with a
  case-insensitive match on `none`/`None`/`NONE`; strong algs like RS256, ES256,
  and HS256 are not matched.
- 05eea03: Add `auth.py.jwt.hardcoded-secret` (AUTH-PY-JWT-003, CWE-798). Flags PyJWT
  `jwt.encode(payload, "literal", ...)` and `jwt.decode(token, "literal", ...)`
  calls where the signing/verification key is a hardcoded string literal — anyone
  who can read the source or git history can forge tokens, an authentication
  bypass. Load the key from `os.environ` or a secret manager instead. A
  `metavariable-regex` requires the key argument to be a quoted string literal, so
  `os.environ["JWT_SECRET"]`, `settings.SECRET_KEY`, and plain variables are not
  matched.
- 6e8510d: Add `auth.py.jwt.no-algorithms` (AUTH-PY-JWT-004, CWE-347). Flags PyJWT
  `jwt.decode(token, key, ...)` calls that verify with a key but omit an explicit
  `algorithms` allowlist — without pinning the accepted algorithms, a token signed
  with an unexpected algorithm can be accepted, enabling algorithm-confusion
  attacks. Always pass `algorithms=["RS256"]` (or the algorithm you expect).
  Scoped to the `jwt.` alias; calls that already pin `algorithms`, single-argument
  `jwt.decode(token)`, signature-disabled decodes (`verify=False` /
  `options={"verify_signature": False}`, covered by `auth.py.jwt.no-verify`), and
  `jwt.encode(...)` are not matched.
- 6e8510d: Add `auth.py.secret.django-hardcoded-key` (AUTH-PY-SECRET-002): flags a Django
  `SECRET_KEY` set to a hard-coded string literal at module level —
  `SECRET_KEY = "..."`, typically the auto-generated `django-insecure-...` value
  committed by mistake. A hard-coded `SECRET_KEY` lets anyone forge session,
  CSRF and password-reset tokens and bypass authentication (CWE-798, OWASP
  A07:2021). Values loaded from `os.environ`, `env()`, `config()`, or a variable
  are not flagged.
- 05eea03: Add `auth.py.secret.flask-hardcoded-key` (AUTH-PY-SECRET-001): flags a Flask
  `SECRET_KEY` set to a hard-coded string literal — `app.secret_key = "..."`,
  `app.config["SECRET_KEY"] = "..."`, or `app.config.update(SECRET_KEY="...")`.
  A hard-coded session-signing key lets anyone forge session cookies and
  impersonate any user (CWE-798, OWASP A07:2021). Values loaded from
  `os.environ`, `os.urandom()`, config objects, or variables are not flagged.
- ade6ded: Add `auth.rust.cookie.insecure` (AUTH-RUST-COOKIE-001): flags session/auth
  cookies built with a security attribute explicitly disabled — `secure(false)`
  or `http_only(false)` on a cookie builder (for example
  `Cookie::build(...).secure(false)`). With `secure(false)` the cookie travels
  over plain HTTP; with `http_only(false)` it is readable from JavaScript —
  either way the session/token cookie can be stolen (CWE-614, OWASP A05:2021).
  Only the literal `false` is matched; `secure(true)`, `http_only(true)`, and the
  absence of the call are not flagged.
- ade6ded: feat(rules): add `auth.rust.cors.permissive` (AUTH-RUST-CORS-001). Flags
  wide-open CORS policies in Rust web stacks — actix-web `Cors::permissive()`,
  tower-http `CorsLayer::permissive()` / `CorsLayer::very_permissive()`, and
  `CorsLayer::new().allow_origin(Any)`. Explicit origin allowlists are not
  flagged. CWE-942, OWASP A05:2021.
- 46302b1: Add `auth.rust.crypto.bcrypt-low-cost` (AUTH-RUST-CRYPTO-002, CWE-916).
  Flags `bcrypt::hash` / `bcrypt::hash_with_result` called with a numeric
  literal cost factor below 10 in Rust (e.g. `bcrypt::hash(password, 8)`). A low
  work factor makes each hash cheap to compute, letting attackers brute-force
  stolen password hashes too quickly. A `metavariable-comparison` constrains the
  match to numeric literals < 10, so `bcrypt::DEFAULT_COST`, a cost ≥ 10, or a
  cost passed via a variable are not flagged. Recommends `bcrypt::DEFAULT_COST`
  (12) or a cost factor of 12 or higher.
- 46302b1: Add `auth.rust.crypto.weak-cipher` (AUTH-RUST-CRYPTO-003, CWE-327). Flags use
  of broken or deprecated RustCrypto ciphers to protect sensitive data: DES
  (`Des::new`, crate `des`), 3DES (`TdesEde3::new` / `TdesEde2::new`), and RC4
  (`Rc4::new`, crate `rc4`). These have 64-bit blocks (Sweet32) or known
  keystream biases (RFC 7465) and leave tokens and secrets inadequately
  protected. Use an authenticated AEAD cipher instead — AES-GCM
  (`Aes256Gcm::new`, crate `aes-gcm`) or ChaCha20-Poly1305
  (`ChaCha20Poly1305::new`); modern AEAD constructors are not flagged.
- ade6ded: Add `auth.rust.crypto.weak-password-hash` (AUTH-RUST-CRYPTO-001, CWE-916).
  Flags passwords hashed with a fast, general-purpose digest in Rust — MD5 via
  the `md5` crate (`md5::compute(password)`) or SHA-1/SHA-256/SHA-512 via the
  RustCrypto `sha1`/`sha2` crates (`Sha256::digest(password.as_bytes())`,
  including the streaming `hasher.update(password)` form). Fast digests make
  offline brute-force and rainbow-table attacks cheap and are unsuitable for
  password storage. The rule is anchored to the "password" character of the
  hashed argument (metavariable-regex), so file checksums such as
  `Sha256::digest(file_bytes)` are not flagged, and proper password hashers
  (`argon2`, `bcrypt`, `scrypt`) are recommended instead.
- 46302b1: Add `auth.rust.flow.timing-unsafe-compare` (AUTH-RUST-FLOW-001, CWE-208).
  Flags secret-shaped values (`password`, `token`, `secret`, `apikey`, `hmac`,
  `signature`, `mac`, `digest`) compared with `==` / `!=` in Rust. `PartialEq`
  for slices and strings short-circuits on the first differing byte, so the
  comparison time leaks the matching-prefix length — a classic timing-attack
  vector. The rule recommends a constant-time comparison (`subtle::ConstantTimeEq`
  or the `constant_time_eq` crate). Anchored to a secret-shaped variable name
  (metavariable-regex) and carved out for non-content comparisons — length checks
  (`token.len() == 32`), string-literal comparisons (`secret == "demo"`), and
  `None` presence checks — so ordinary equality is not flagged.
- ade6ded: feat(rules): add `auth.rust.jwt.disable-signature-validation`
  (`AUTH-RUST-JWT-001`). Flags
  `Validation::insecure_disable_signature_validation()` from the `jsonwebtoken`
  crate, which turns off JWT signature verification and lets `decode` accept
  forged tokens (CWE-347, OWASP API2:2023).
- ade6ded: Add `auth.rust.jwt.hardcoded-secret` (AUTH-RUST-JWT-002, CWE-798). Flags
  jsonwebtoken HMAC keys that are hardcoded as literals in
  `EncodingKey::from_secret` / `DecodingKey::from_secret`: a byte-string literal
  `b"..."` or a string literal coerced with `"...".as_ref()` / `"...".as_bytes()`.
  Anyone who can read the source or git history can forge or tamper with tokens,
  an authentication bypass. Load the secret at runtime from the environment or a
  secret manager instead. The literal must sit in key position, so
  `from_secret(secret.as_bytes())` (a variable) and
  `from_secret(std::env::var("JWT_SECRET")?.as_bytes())` are not matched.
- 46302b1: feat(rules): add `auth.rust.jwt.no-aud-validation` (`AUTH-RUST-JWT-004`).
  Flags JWT audience validation being disabled via `validate_aud: false` (struct
  literal) or `$V.validate_aud = false` on a `jsonwebtoken` `Validation`. Without
  an audience check, a token minted for another service can be replayed against
  this API. Keep `validate_aud` at `true` and set the expected audience with
  `validation.set_audience(...)` (CWE-287, OWASP API2:2023).
- 46302b1: feat(rules): add `auth.rust.jwt.no-expiration-validation` (AUTH-RUST-JWT-003).
  Flags JWT expiration validation being turned off on the `jsonwebtoken`
  `Validation`: a struct literal with `validate_exp: false` and an assignment
  `validation.validate_exp = false`. With `exp` checking disabled, `decode`
  accepts already-expired tokens, so leaked or stolen access tokens stay usable
  forever (CWE-613, OWASP API2:2023). `validate_exp: true`, `= true`, and the
  field's absence (default `true`) are not flagged.
- 46302b1: Add `auth.rust.tls.accept-invalid-hostnames` (AUTH-RUST-TLS-002): flags a
  reqwest client built with `danger_accept_invalid_hostnames(true)`, which turns
  off TLS hostname verification. A certificate valid for any other domain is then
  accepted, letting an attacker holding a valid certificate for a host they
  control mount a man-in-the-middle attack and steal OAuth/OIDC authorization
  codes, access tokens, and client secrets in transit (CWE-297, OWASP A02:2021).
  Only the literal `true` is matched; `danger_accept_invalid_hostnames(false)` and
  the absence of the call are not flagged. Distinct from
  `auth.rust.tls.accept-invalid-certs`, which targets `danger_accept_invalid_certs`.
- b3ccff7: Add `auth.secret.public-env-secret` (AUTH-SECRET-002, CWE-200). Flags secrets
  read from environment variables that carry a client-public prefix and so get
  inlined into the browser bundle: `process.env` with `NEXT_PUBLIC_` / `REACT_APP_`
  / `GATSBY_` / `PUBLIC_`, and `import.meta.env` with `VITE_`, where the name also
  contains a secret-ish suffix (`SECRET`, `PRIVATE`, `PASSWORD`, `API_KEY`,
  `_TOKEN`, `ACCESS_TOKEN`, `CLIENT_SECRET`). Anything on such a variable ships to
  every visitor, so the secret is published rather than protected. Keep it in a
  server-only variable. Genuinely public values are not flagged: server-only env
  without a public prefix (`SESSION_SECRET`, `STRIPE_SECRET_KEY`), public values
  without a secret suffix (`NEXT_PUBLIC_API_URL`, `VITE_API_URL`), and deliberately
  public names (`PUBLISHABLE`, `CLIENT_ID`, `PUBLIC_KEY`) are all excluded.
- 1941d79: Add rule `auth.flow.weak-password-hash` (AUTH-FLOW-006, CWE-916): flags passwords hashed with fast/broken hashes (`crypto.createHash('md5'|'sha1'|'sha256'|'sha512')`) and recommends bcrypt/argon2/scrypt, while avoiding false positives on checksums, file digests, and HMAC signatures.
- ade6ded: feat(rules): Rust rule packs. The language-aware infrastructure now also covers
  Rust — `.rs` fixtures, `auth.rust.<category>.<name>` ids, and `rust` doc
  fences — with zero change to existing JS/TS, Python, Go, or Java rules. Ships
  the first Rust rule, `auth.rust.tls.accept-invalid-certs` (reqwest
  `danger_accept_invalid_certs(true)`, CWE-295).
- 1941d79: Add `auth.session.hardcoded-secret` (AUTH-SESSION-003): flags hard-coded string
  literals passed as the `secret` option to `express-session` / `cookie-session`
  (the canonical `secret: 'keyboard cat'`). A hard-coded signing secret lets
  anyone forge session cookies (CWE-798). `process.env`, config references, and
  function calls are not flagged.
- 1941d79: feat(rules): add `auth.flow.weak-bcrypt-rounds` (AUTH-FLOW-007). Flags bcrypt
  cost factors below 10 in `bcrypt.hash`/`hashSync`/`genSalt`/`genSaltSync`
  (and `bcryptjs`), which make stolen password hashes cheap to brute-force.
  Uses `metavariable-comparison` so only numeric literals under the threshold
  match — variables and constants (`bcrypt.hash(pw, saltRounds)`) are ignored.
  OWASP recommends a cost of ≥ 12.

### Patch Changes

- 447293f: fix(rules): stop `auth.flow.timing-unsafe-compare` flagging comparisons to
  literals. Comparing a secret-named value to a string or boolean literal
  (`pw !== 'password'`, `idToken === false`) is never a timing-attack target —
  a literal baked into source is already public, so there is nothing to leak.
  This was the dominant false-positive class on next-auth in real-world
  validation (5 findings → 2 genuine ones).

## 0.1.1

### Patch Changes

- Declare `fast-glob` as a runtime dependency of `oauthlint-rules`. It was a
  devDependency, so standalone installs from npm failed at runtime with
  `ERR_MODULE_NOT_FOUND: Cannot find package 'fast-glob'` (it only resolved in the
  monorepo via hoisting). The CLI bumps too so it depends on the fixed rules.
