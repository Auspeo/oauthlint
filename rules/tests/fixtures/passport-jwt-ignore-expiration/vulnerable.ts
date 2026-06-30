import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import passport from 'passport';

declare const verify: (payload: unknown, done: unknown) => void;

// ruleid: auth.passport.jwt-ignore-expiration
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
      ignoreExpiration: true,
    },
    verify,
  ),
);

// ruleid: auth.passport.jwt-ignore-expiration
const strategy = new JwtStrategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    ignoreExpiration: true,
    secretOrKey: process.env.JWT_SECRET,
  },
  verify,
);

export { strategy };
