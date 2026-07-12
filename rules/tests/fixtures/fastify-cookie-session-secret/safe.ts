import Fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';

const fastify = Fastify();

// ok: auth.fastify.cookie-session-secret -- secret read from the environment
fastify.register(fastifyCookie, { secret: process.env.COOKIE_SECRET });

// ok: auth.fastify.cookie-session-secret -- secret resolved from config
fastify.register(fastifySession, {
  secret: config.sessionSecret,
  cookie: { secure: true },
});
