import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';

const fastify = Fastify();

// ruleid: auth.fastify.cors-wildcard-credentials
fastify.register(fastifyCors, { origin: '*', credentials: true });

// ruleid: auth.fastify.cors-wildcard-credentials
fastify.register(fastifyCors, { credentials: true, origin: true });
