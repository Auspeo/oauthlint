import Fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';

const fastify = Fastify();

// ruleid: auth.fastify.cookie-session-secret
fastify.register(fastifyCookie, { secret: 'k3yb0ard-cat-cookie-secret' });

// ruleid: auth.fastify.cookie-session-secret
fastify.register(fastifySession, {
  secret: 'a-32-char-hardcoded-session-secret',
  cookie: { secure: true },
});
