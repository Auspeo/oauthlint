// ruleid: auth.session.id-in-url
export const badLink = `/api/profile?session=${'sid-abc-123-very-long-here'}`;

// ruleid: auth.session.id-in-url
export const badLink2 = '/api/admin?api_key=secret-key-here-very-long';

// ruleid: auth.session.id-in-url
export const badLink3 = '/api/data?access_token=eyJabc123';
