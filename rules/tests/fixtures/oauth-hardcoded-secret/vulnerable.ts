// ruleid: auth.oauth.hardcoded-secret
export const oauthBad = {
  client_id: 'app-prod',
  client_secret: 'sk_live_abc123XYZ789verylong',
};

// ruleid: auth.oauth.hardcoded-secret
export const oauthBad2 = {
  clientId: 'app-prod',
  clientSecret: 'super-secret-value-here-abcdef',
};

// ruleid: auth.oauth.hardcoded-secret
export const config = {
  CLIENT_SECRET: 'GOCSPX-aaaaaaaaaaaaaaaaaaaaaaa',
};
