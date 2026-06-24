// ruleid: auth.flow.credentials-in-url
export function login(pw: string) {
  return fetch('https://api.example.com/login?password=' + pw);
}

// ruleid: auth.flow.credentials-in-url
export function callApi(secret: string) {
  return fetch(`https://api.example.com/data?secret=${secret}`);
}

// ruleid: auth.flow.credentials-in-url
export function buildAuthUrl(clientSecret: string) {
  const params = new URLSearchParams();
  params.append('client_secret', clientSecret);
  return `https://auth.example.com/token?${params.toString()}`;
}

// ruleid: auth.flow.credentials-in-url
export const apiKeyUrl = 'https://api.example.com/search?q=cats&api_key=ABC123';
