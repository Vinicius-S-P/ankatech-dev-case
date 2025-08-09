import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { allocationController } from '../controllers/allocationController';

export default async function allocationRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.post('/', allocationController.create);
  fastify.get('/', allocationController.findAll);
}