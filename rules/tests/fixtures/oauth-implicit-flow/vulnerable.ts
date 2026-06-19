export const badConfig = {
  // ruleid: auth.oauth.implicit-flow
  response_type: 'token',
  client_id: 'spa-app',
};

// ruleid: auth.oauth.implicit-flow
export const badUrl =
  'https://accounts.google.com/o/oauth2/v2/auth?response_type=token&client_id=spa-app';

export const badConfig2 = {
  // ruleid: auth.oauth.implicit-flow
  response_type: 'id_token token',
};
