import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';

const fastify = Fastify();

// ruleid: auth.fastify.jwt-hardcoded-secret
fastify.register(fastifyJwt, { secret: 'super-secret-signing-key' });

const app = Fastify();
// ruleid: auth.fastify.jwt-hardcoded-secret
app.register(require('@fastify/jwt'), {
  secret: 'another-hardcoded-key',
  sign: { expiresIn: '10m' },
});
