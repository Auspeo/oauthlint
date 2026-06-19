// ruleid: auth.session.id-in-url
export const badLink = `/api/profile?session=${'sid-abc-123-very-long-here'}`;

// ruleid: auth.session.id-in-url
export const badLink2 = '/api/admin?api_key=secret-key-here-very-long';

// ruleid: auth.session.id-in-url
export const badLink3 = '/api/data?access_token=eyJabc123';

// ruleid: auth.session.id-in-url -- bare token param
export const badLink4 = '/api/data?token=abc-123-secret';

// ruleid: auth.session.id-in-url -- refresh token param
export const badLink5 = '/auth/refresh?refresh_token=rt-abc-123';
