import Fastify from 'fastify';

// ok: auth.fastify.trust-proxy-true -- bounded hop count (one proxy in front)
const fastify = Fastify({ trustProxy: 1 });

// ok: auth.fastify.trust-proxy-true -- a specific CIDR, not "all proxies"
const app = Fastify({ trustProxy: '127.0.0.1/8' });

// ok: auth.fastify.trust-proxy-true -- trust disabled entirely
const app2 = Fastify({ trustProxy: false });

// ok: auth.fastify.trust-proxy-true -- default construction, no proxy trust
const app3 = Fastify({ logger: true });
