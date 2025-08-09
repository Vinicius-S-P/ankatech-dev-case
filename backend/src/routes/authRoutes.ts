import { FastifyInstance, FastifyPluginOptions } from 'fastify';

export default async function authRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.post('/login', async (request, reply) => {
    return { token: 'dummy-token' };
  });
}