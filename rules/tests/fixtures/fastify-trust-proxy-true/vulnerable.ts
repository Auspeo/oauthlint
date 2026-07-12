import Fastify from 'fastify';

// ruleid: auth.fastify.trust-proxy-true
const fastify = Fastify({ trustProxy: true });

// ruleid: auth.fastify.trust-proxy-true
const app = Fastify({ logger: true, trustProxy: true });
