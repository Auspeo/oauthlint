import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import passport from 'passport';

declare const verify: (payload: unknown, done: unknown) => void;

// ok: auth.passport.jwt-ignore-expiration -- expiry enforced (default)
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    },
    verify,
  ),
);

// ok: auth.passport.jwt-ignore-expiration -- explicitly false, expiry enforced
const strategy = new JwtStrategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    ignoreExpiration: false,
    secretOrKey: process.env.JWT_SECRET,
  },
  verify,
);

// ok: auth.passport.jwt-ignore-expiration -- unrelated library, not passport-jwt
const pollerOptions = {
  ignoreExpiration: true,
};

export { strategy, pollerOptions };
