---
"oauthlint-rules": minor
---

Add NestJS and Fastify rule packs (7 low-false-positive rules for AI-generated Node backends).

NestJS:
- `auth.nestjs.jwt-hardcoded-secret`: hard-coded `secret` / `secretOrPrivateKey` string literal in `JwtModule.register` / `registerAsync` / `new JwtService`.
- `auth.nestjs.guard-always-true`: a `CanActivate` guard whose `canActivate` returns a constant `true` (auth bypass).
- `auth.nestjs.cors-wildcard-credentials`: `app.enableCors()` with `origin: '*'`/`true` together with `credentials: true`.

Fastify:
- `auth.fastify.jwt-hardcoded-secret`: `@fastify/jwt` registered with a hard-coded string `secret`.
- `auth.fastify.cookie-session-secret`: `@fastify/cookie` / `@fastify/session` registered with a hard-coded string `secret`.
- `auth.fastify.cors-wildcard-credentials`: `@fastify/cors` with `origin: '*'`/`true` together with `credentials: true`.
- `auth.fastify.trust-proxy-true`: `Fastify({ trustProxy: true })` (unbounded proxy trust).

Every rule ships a vulnerable and a safe fixture, is anchored to the framework API, and validated to fire zero times on the NestJS core and `@fastify/jwt`/`session`/`cors` library source.
