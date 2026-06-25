---
id: 01-express-jwt
language: javascript
ext: js
stack: Express, jsonwebtoken
domains: [jwt]
---
Implement a login endpoint for an Express.js API. POST /login takes username + password, checks them, and returns a JWT the client can use for subsequent requests. Add a middleware that protects other routes by verifying the JWT.
