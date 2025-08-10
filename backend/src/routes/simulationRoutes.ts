import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function simulationRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Get all simulations
  fastify.get('/', {
    schema: {
      description: 'List all simulations',
      tags: ['simulations'],
      security: [{ Bearer: [] }]
    },
    preHandler: [(fastify as any).authenticate]
  }, async (request: any, reply) => {
    const { clientId } = request.query;
    const where: any = {};
    
    if (clientId) where.clientId = clientId;
    
    if (request.user.role === 'VIEWER') {
      where.client = { advisorId: request.user.id };
    }
    
    const simulations = await prisma.simulation.findMany({
      where,
      include: {
        client: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return reply.send({ simulations });
  });
  
  // Get simulation by ID
  fastify.get('/:id', {
    schema: {
      description: 'Get simulation by ID',
      tags: ['simulations'],
      security: [{ Bearer: [] }]
    },
    preHandler: [(fastify as any).authenticate]
  }, async (request: any, reply) => {
    const { id } = request.params;
    
    const simulation = await prisma.simulation.findFirst({
      where: {
        id,
        ...(request.user.role === 'VIEWER' 
          ? { client: { advisorId: request.user.id } } 
          : {})
      },
      include: { client: true }
    });
    
    if (!simulation) {
      return reply.status(404).send({ message: 'Simulation not found' });
    }
    
    return reply.send(simulation);
  });
  
  // Delete simulation
  fastify.delete('/:id', {
    schema: {
      description: 'Delete simulation',
      tags: ['simulations'],
      security: [{ Bearer: [] }]
    },
    preHandler: [(fastify as any).authorize(['ADVISOR'])]
  }, async (request: any, reply) => {
    const { id } = request.params;
    
    const existing = await prisma.simulation.findFirst({
      where: {
        id,
        client: { advisorId: request.user.id }
      }
    });
    
    if (!existing) {
      return reply.status(404).send({ message: 'Simulation not found' });
    }
    
    await prisma.simulation.delete({ where: { id } });
    
    return reply.status(204).send();
  });
}
