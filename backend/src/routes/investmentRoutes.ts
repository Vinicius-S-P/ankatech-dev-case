import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { investmentController } from '../controllers/investmentController';

export default async function investmentRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.post('/', investmentController.create);
  fastify.get('/', investmentController.findAll);
}