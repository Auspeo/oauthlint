import jwt from 'jsonwebtoken';

const RSA_PUBLIC = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxxxxxxxxxxxxxxxxxxxx
-----END PUBLIC KEY-----`;

// ruleid: auth.jwt.algorithm-confusion
export function badVerify(token: string) {
  return jwt.verify(token, RSA_PUBLIC, { algorithms: ['HS256'] });
}

// ruleid: auth.jwt.algorithm-confusion
export function badVerifyNoOpts(token: string) {
  return jwt.verify(token, RSA_PUBLIC);
}
