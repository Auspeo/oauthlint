---
id: 03-react-token
language: typescript
ext: tsx
stack: React
domains: [jwt]
---
Implement a React auth hook/context. It calls the backend /login with email+password, stores the returned JWT so the user stays logged in across page reloads, attaches it to subsequent API calls, and exposes login/logout.
