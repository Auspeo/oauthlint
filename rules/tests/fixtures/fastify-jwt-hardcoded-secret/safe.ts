import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import { readFileSync } from 'node:fs';

const fastify = Fastify();

// ok: auth.fastify.jwt-hardcoded-secret -- secret read from the environment
fastify.register(fastifyJwt, { secret: process.env.JWT_SECRET });

const app = Fastify();
// ok: auth.fastify.jwt-hardcoded-secret -- asymmetric key pair loaded from disk
app.register(fastifyJwt, {
  secret: {
    private: readFileSync('private.pem'),
    public: readFileSync('public.pem'),
  },
});
