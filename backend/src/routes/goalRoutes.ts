import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { goalController } from '../controllers/goalController';

export default async function goalRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.post('/', goalController.create);
  fastify.get('/', goalController.findAll);
}