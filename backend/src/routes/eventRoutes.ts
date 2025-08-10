import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { PrismaClient, EventType, Frequency } from '@prisma/client';

const prisma = new PrismaClient();

// Schemas
const createEventSchema = z.object({
  clientId: z.string(),
  type: z.nativeEnum(EventType),
  name: z.string().min(1),
  description: z.string().optional(),
  value: z.number().positive(),
  frequency: z.nativeEnum(Frequency),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional()
});

const updateEventSchema = createEventSchema.partial().omit({ clientId: true });

export default async function eventRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Get all events
  fastify.get('/', {
    schema: {
      description: 'List all events',
      tags: ['events'],
      security: [{ Bearer: [] }]
    },
    preHandler: [(fastify as any).authenticate]
  }, async (request: any, reply) => {
    const { clientId, type, frequency } = request.query;
    const where: any = {};
    
    if (clientId) where.clientId = clientId;
    if (type) where.type = type;
    if (frequency) where.frequency = frequency;
    
    if (request.user.role === 'VIEWER') {
      where.client = { advisorId: request.user.id };
    }
    
    const events = await prisma.event.findMany({
      where,
      include: {
        client: {
          select: { name: true, email: true }
        }
      },
      orderBy: { startDate: 'desc' }
    });
    
    return reply.send({ events });
  });
  
  // Get upcoming events
  fastify.get('/upcoming/:clientId', {
    schema: {
      description: 'Get upcoming events for a client',
      tags: ['events'],
      security: [{ Bearer: [] }]
    },
    preHandler: [(fastify as any).authenticate]
  }, async (request: any, reply) => {
    const { clientId } = request.params;
    const { days = 30 } = request.query;
    
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        ...(request.user.role === 'VIEWER' ? { advisorId: request.user.id } : {})
      }
    });
    
    if (!client) {
      return reply.status(404).send({ message: 'Client not found' });
    }
    
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    const events = await prisma.event.findMany({
      where: {
        clientId,
        OR: [
          // One-time events in the period
          {
            frequency: 'ONCE',
            startDate: {
              gte: now,
              lte: futureDate
            }
          },
          // Recurring events that are active
          {
            frequency: { in: ['MONTHLY', 'YEARLY'] },
            startDate: { lte: futureDate },
            OR: [
              { endDate: null },
              { endDate: { gte: now } }
            ]
          }
        ]
      },
      orderBy: { startDate: 'asc' }
    });
    
    // Calculate next occurrences for recurring events
    const upcomingEvents = events.map(event => {
      let nextOccurrence = event.startDate;
      
      if (event.frequency === 'MONTHLY') {
        while (nextOccurrence < now) {
          nextOccurrence = new Date(nextOccurrence);
          nextOccurrence.setMonth(nextOccurrence.getMonth() + 1);
        }
      } else if (event.frequency === 'YEARLY') {
        while (nextOccurrence < now) {
          nextOccurrence = new Date(nextOccurrence);
          nextOccurrence.setFullYear(nextOccurrence.getFullYear() + 1);
        }
      }
      
      return {
        ...event,
        nextOccurrence
      };
    });
    
    return reply.send({
      events: upcomingEvents.filter(e => e.nextOccurrence <= futureDate)
    });
  });
  
  // Create event
  fastify.post('/', {
    schema: {
      description: 'Create a new event',
      tags: ['events'],
      security: [{ Bearer: [] }]
    },
    preHandler: [(fastify as any).authorize(['ADVISOR'])]
  }, async (request: any, reply) => {
    try {
      const data = createEventSchema.parse(request.body);
      
      const client = await prisma.client.findFirst({
        where: {
          id: data.clientId,
          advisorId: request.user.id
        }
      });
      
      if (!client) {
        return reply.status(404).send({ message: 'Client not found' });
      }
      
      const event = await prisma.event.create({
        data: {
          ...data,
          startDate: new Date(data.startDate),
          endDate: data.endDate ? new Date(data.endDate) : null
        }
      });
      
      return reply.status(201).send(event);
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
  
  // Update event
  fastify.put('/:id', {
    schema: {
      description: 'Update event',
      tags: ['events'],
      security: [{ Bearer: [] }]
    },
    preHandler: [(fastify as any).authorize(['ADVISOR'])]
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      const data = updateEventSchema.parse(request.body);
      
      const existing = await prisma.event.findFirst({
        where: {
          id,
          client: { advisorId: request.user.id }
        }
      });
      
      if (!existing) {
        return reply.status(404).send({ message: 'Event not found' });
      }
      
      const updateData: any = { ...data };
      if (data.startDate) updateData.startDate = new Date(data.startDate);
      if (data.endDate) updateData.endDate = new Date(data.endDate);
      
      const event = await prisma.event.update({
        where: { id },
        data: updateData
      });
      
      return reply.send(event);
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
  
  // Delete event
  fastify.delete('/:id', {
    schema: {
      description: 'Delete event',
      tags: ['events'],
      security: [{ Bearer: [] }]
    },
    preHandler: [(fastify as any).authorize(['ADVISOR'])]
  }, async (request: any, reply) => {
    const { id } = request.params;
    
    const existing = await prisma.event.findFirst({
      where: {
        id,
        client: { advisorId: request.user.id }
      }
    });
    
    if (!existing) {
      return reply.status(404).send({ message: 'Event not found' });
    }
    
    await prisma.event.delete({ where: { id } });
    
    return reply.status(204).send();
  });
  
  // Get cash flow summary
  fastify.get('/cash-flow/:clientId', {
    schema: {
      description: 'Get cash flow summary for a client',
      tags: ['events'],
      security: [{ Bearer: [] }]
    },
    preHandler: [(fastify as any).authenticate]
  }, async (request: any, reply) => {
    const { clientId } = request.params;
    const { months = 12 } = request.query;
    
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        ...(request.user.role === 'VIEWER' ? { advisorId: request.user.id } : {})
      }
    });
    
    if (!client) {
      return reply.status(404).send({ message: 'Client not found' });
    }
    
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + months);
    
    const events = await prisma.event.findMany({
      where: {
        clientId,
        startDate: { lte: endDate },
        OR: [
          { endDate: null },
          { endDate: { gte: now } }
        ]
      }
    });
    
    // Calculate monthly cash flow
    const cashFlow = [];
    
    for (let i = 0; i < months; i++) {
      const monthDate = new Date(now);
      monthDate.setMonth(monthDate.getMonth() + i);
      
      let income = 0;
      let expenses = 0;
      
      for (const event of events) {
        if (shouldApplyEventInMonth(event, monthDate)) {
          if (event.type === 'INCOME' || event.type === 'DEPOSIT') {
            income += event.value;
          } else {
            expenses += event.value;
          }
        }
      }
      
      cashFlow.push({
        month: monthDate.toISOString().slice(0, 7),
        income,
        expenses,
        netFlow: income - expenses
      });
    }
    
    const totalIncome = cashFlow.reduce((sum, cf) => sum + cf.income, 0);
    const totalExpenses = cashFlow.reduce((sum, cf) => sum + cf.expenses, 0);
    const averageMonthlyFlow = (totalIncome - totalExpenses) / months;
    
    return reply.send({
      cashFlow,
      summary: {
        totalIncome,
        totalExpenses,
        netFlow: totalIncome - totalExpenses,
        averageMonthlyFlow
      }
    });
  });
}

// Helper function
function shouldApplyEventInMonth(event: any, monthDate: Date): boolean {
  if (event.startDate > monthDate) return false;
  if (event.endDate && event.endDate < monthDate) return false;
  
  if (event.frequency === 'ONCE') {
    return (
      event.startDate.getFullYear() === monthDate.getFullYear() &&
      event.startDate.getMonth() === monthDate.getMonth()
    );
  }
  
  if (event.frequency === 'MONTHLY') {
    return true;
  }
  
  if (event.frequency === 'YEARLY') {
    return event.startDate.getMonth() === monthDate.getMonth();
  }
  
  return false;
}
