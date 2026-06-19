interface Req {
  query: { state?: string; code?: string };
  body: { state?: string };
}

export function badCallback(req: Req) {
  // ruleid: auth.oauth.no-state-validation
  const state = req.query.state;
  console.log(`received state ${state}`);
  return req.query.code;
}

export function badCallback2(req: Req) {
  // ruleid: auth.oauth.no-state-validation
  return req.body.state;
}
