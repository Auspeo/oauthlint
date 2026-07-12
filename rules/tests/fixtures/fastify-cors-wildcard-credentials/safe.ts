import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';

const fastify = Fastify();

// ok: auth.fastify.cors-wildcard-credentials -- explicit allowlist + credentials
fastify.register(fastifyCors, {
  origin: ['https://app.example.com', 'https://admin.example.com'],
  credentials: true,
});

// ok: auth.fastify.cors-wildcard-credentials -- public API, credentials stays off
fastify.register(fastifyCors, { origin: '*' });

// ok: auth.fastify.cors-wildcard-credentials -- single trusted origin string
fastify.register(fastifyCors, { origin: 'https://app.example.com', credentials: true });
