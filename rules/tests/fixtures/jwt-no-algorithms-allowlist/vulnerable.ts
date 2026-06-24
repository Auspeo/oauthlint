import jwt from 'jsonwebtoken';

// ruleid: auth.jwt.no-algorithms-allowlist
export const claims1 = jwt.verify(token, process.env.JWT_SECRET!);

// ruleid: auth.jwt.no-algorithms-allowlist
export const claims2 = jwt.verify(token, publicKey, {
  audience: 'https://api.example.com',
  issuer: 'https://auth.example.com',
});

// ruleid: auth.jwt.no-algorithms-allowlist
export const claims3 = jwt.verify(token, secret, {});

// ruleid: auth.jwt.no-algorithms-allowlist
export const claims4 = jwt.verify(token, secret, { ignoreExpiration: true });
