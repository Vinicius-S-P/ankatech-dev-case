import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { clientController } from '../controllers/clientController';

export default async function clientRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.post('/', clientController.create);
  fastify.get('/', clientController.findAll);
}