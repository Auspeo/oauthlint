// ruleid: auth.jwt.in-url
export const downloadLink =
  'https://api.example.com/files/123?token=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.abc';

// ruleid: auth.jwt.in-url
export const magicLink =
  'https://app.example.com/auth/magic?jwt=eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoiZm9vIn0.xyz';

// ruleid: auth.jwt.in-url
export const fragmentLink =
  'https://app.example.com/dashboard#access_token=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.zzz';

// ruleid: auth.jwt.in-url -- JWT in a path segment
export const pathLink =
  'https://app.example.com/verify/eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoiZm9vIn0.qqq';
