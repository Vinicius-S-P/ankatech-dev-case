import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { PrismaClient, GoalType } from '@prisma/client';

const prisma = new PrismaClient();

const createGoalSchema = z.object({
  clientId: z.string(),
  type: z.nativeEnum(GoalType),
  name: z.string().min(1),
  description: z.string().optional(),
  targetValue: z.number().positive(),
  targetDate: z.string().datetime(),
  currentValue: z.number().min(0).default(0),
  monthlyIncome: z.number().positive().optional()
});

const updateGoalSchema = createGoalSchema.partial().omit({ clientId: true });

export default async function goalRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
) {
  fastify.get('/', {
    schema: {
      description: 'List all goals',
      tags: ['goals'],
      security: [{ Bearer: [] }]
    },
    preHandler: [(fastify as any).authenticate]
  }, async (request: any, reply) => {
    const where: any = {};
    
    if (request.user.role === 'VIEWER') {
      where.client = { advisorId: request.user.id };
    }
    
    const goals = await prisma.goal.findMany({
      where,
      include: {
        client: {
          select: { name: true, email: true }
        }
      }
    });
    
    return reply.send({ goals });
  });
  
  fastify.get('/:id', {
    schema: {
      description: 'Get goal by ID',
      tags: ['goals'],
      security: [{ Bearer: [] }]
    },
    preHandler: [(fastify as any).authenticate]
  }, async (request: any, reply) => {
    const { id } = request.params;
    
    const goal = await prisma.goal.findFirst({
      where: {
        id,
        ...(request.user.role === 'VIEWER' 
          ? { client: { advisorId: request.user.id } } 
          : {})
      },
      include: { client: true }
    });
    
    if (!goal) {
      return reply.status(404).send({ message: 'Goal not found' });
    }
    
    return reply.send(goal);
  });
  
  fastify.post('/', {
    schema: {
      description: 'Create a new goal',
      tags: ['goals'],
      security: [{ Bearer: [] }]
    },
    preHandler: [(fastify as any).authorize(['ADVISOR'])]
  }, async (request: any, reply) => {
    try {
      console.log('Request body:', request.body);
      const data = createGoalSchema.parse(request.body);
      
      const client = await prisma.client.findFirst({
        where: {
          id: data.clientId,
          ...(request.user.role === 'VIEWER' ? { advisorId: request.user.id } : {})
        }
      });
      
      if (!client) {
        return reply.status(404).send({ message: 'Client not found' });
      }
      
      const goal = await prisma.goal.create({
        data: {
          ...data,
          targetDate: new Date(data.targetDate)
        }
      });
      
      return reply.status(201).send(goal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          message: 'Validation Error',
          errors: error.flatten().fieldErrors
        });
      }
      throw error;
    }
  });
  
  fastify.put('/:id', {
    schema: {
      description: 'Update goal',
      tags: ['goals'],
      security: [{ Bearer: [] }]
    },
    preHandler: [(fastify as any).authorize(['ADVISOR'])]
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      const data = updateGoalSchema.parse(request.body);
      
      const existing = await prisma.goal.findFirst({
        where: {
          id,
          client: { advisorId: request.user.id }
        }
      });
      
      if (!existing) {
        return reply.status(404).send({ message: 'Goal not found' });
      }
      
      const updateData: any = { ...data };
      if (data.targetDate) {
        updateData.targetDate = new Date(data.targetDate);
      }
      
      const goal = await prisma.goal.update({
        where: { id },
        data: updateData
      });
      
      return reply.send(goal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          message: 'Validation Error',
          errors: error.flatten().fieldErrors
        });
      }
      throw error;
    }
  });
  
  fastify.delete('/:id', {
    schema: {
      description: 'Delete a goal',
      tags: ['goals'],
      security: [{ Bearer: [] }]
    },
    preHandler: [(fastify as any).authorize(['ADVISOR'])]
  }, async (request: any, reply) => {
    const { id } = request.params;
    
    const existing = await prisma.goal.findFirst({
      where: {
        id,
        client: { advisorId: request.user.id }
      }
    });
    
    if (!existing) {
      return reply.status(404).send({ message: 'Goal not found' });
    }
    
    await prisma.goal.delete({ where: { id } });
    
    return reply.status(204).send();
  });
}
