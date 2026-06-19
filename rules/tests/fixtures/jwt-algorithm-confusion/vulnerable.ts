import jwt from 'jsonwebtoken';

const RSA_PUBLIC = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxxxxxxxxxxxxxxxxxxxx
-----END PUBLIC KEY-----`;

// ruleid: auth.jwt.algorithm-confusion
export function badVerify(token: string) {
  return jwt.verify(token, RSA_PUBLIC, { algorithms: ['HS256'] });
}

// ruleid: auth.jwt.algorithm-confusion -- mixing HS with an RSA public key
export function badVerifyMixed(token: string, publicKey: string) {
  return jwt.verify(token, publicKey, { algorithms: ['HS256', 'RS256'] });
}
