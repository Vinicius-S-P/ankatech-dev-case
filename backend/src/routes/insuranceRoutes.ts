import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { PrismaClient, InsuranceType, Frequency } from '@prisma/client';

const prisma = new PrismaClient();

const createInsuranceSchema = z.object({
  clientId: z.string(),
  type: z.nativeEnum(InsuranceType),
  provider: z.string().min(1),
  policyNumber: z.string().optional(),
  coverage: z.number().positive(),
  premium: z.number().positive(),
  premiumFrequency: z.nativeEnum(Frequency).default('MONTHLY'),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional()
});

const updateInsuranceSchema = createInsuranceSchema.partial().omit({ clientId: true });

export default async function insuranceRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
) {
  fastify.get('/', {
    schema: {
      description: 'List all insurance policies',
      tags: ['insurance'],
      security: [{ Bearer: [] }]
    },
    preHandler: [(fastify as any).authenticate]
  }, async (request: any, reply) => {
    const { clientId, type } = request.query;
    const where: any = {};
    
    if (clientId) where.clientId = clientId;
    if (type) where.type = type;
    
    
    
    const insurance = await prisma.insurance.findMany({
      where,
      include: {
        client: {
          select: { name: true, email: true }
        }
      },
      orderBy: { startDate: 'desc' }
    });
    
    return reply.send({ insurance });
  });
  
  fastify.get('/summary/:clientId', {
    schema: {
      description: 'Get insurance summary for a client',
      tags: ['insurance'],
      security: [{ Bearer: [] }]
    },
    preHandler: [(fastify as any).authenticate]
  }, async (request: any, reply) => {
    const { clientId } = request.params;
    
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        ...(request.user.role === 'VIEWER' ? { advisorId: request.user.id } : {})
      },
      include: { insurance: true }
    });
    
    if (!client) {
      return reply.status(404).send({ message: 'Client not found' });
    }
    
    const totalCoverage = client.insurance.reduce((sum, ins) => sum + ins.coverage, 0);
    const annualPremiums = client.insurance.reduce((sum, ins) => {
      const multiplier = ins.premiumFrequency === 'MONTHLY' ? 12 : 
                       ins.premiumFrequency === 'YEARLY' ? 1 : 1;
      return sum + (ins.premium * multiplier);
    }, 0);
    
    const byType = client.insurance.reduce((acc: any, ins) => {
      if (!acc[ins.type]) {
        acc[ins.type] = {
          count: 0,
          totalCoverage: 0,
          annualPremium: 0
        };
      }
      acc[ins.type].count++;
      acc[ins.type].totalCoverage += ins.coverage;
      
      const multiplier = ins.premiumFrequency === 'MONTHLY' ? 12 : 
                        ins.premiumFrequency === 'YEARLY' ? 1 : 1;
      acc[ins.type].annualPremium += ins.premium * multiplier;
      
      return acc;
    }, {});
    
    return reply.send({
      totalPolicies: client.insurance.length,
      totalCoverage,
      annualPremiums,
      monthlyPremiums: annualPremiums / 12,
      byType,
      policies: client.insurance
    });
  });
  
  fastify.post('/', {
    schema: {
      description: 'Create new insurance policy',
      tags: ['insurance'],
      security: [{ Bearer: [] }]
    },
    preHandler: [(fastify as any).authorize(['ADVISOR'])]
  }, async (request: any, reply) => {
    try {
      const data = createInsuranceSchema.parse(request.body);
      
      const client = await prisma.client.findFirst({
        where: {
          id: data.clientId,
          ...(request.user.role === 'VIEWER' ? { advisorId: request.user.id } : {})
        }
      });
      
      if (!client) {
        return reply.status(404).send({ message: 'Client not found' });
      }
      
      const insurance = await prisma.insurance.create({
        data: {
          ...data,
          startDate: new Date(data.startDate),
          endDate: data.endDate ? new Date(data.endDate) : null
        }
      });
      
      return reply.status(201).send(insurance);
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
      description: 'Update insurance policy',
      tags: ['insurance'],
      security: [{ Bearer: [] }]
    },
    preHandler: [(fastify as any).authorize(['ADVISOR'])]
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      const data = updateInsuranceSchema.parse(request.body);
      
      const existing = await prisma.insurance.findFirst({
        where: {
          id,
        }
      });
      
      if (!existing) {
        return reply.status(404).send({ message: 'Insurance not found' });
      }
      
      const updateData: any = { ...data };
      if (data.startDate) updateData.startDate = new Date(data.startDate);
      if (data.endDate) updateData.endDate = new Date(data.endDate);
      
      const insurance = await prisma.insurance.update({
        where: { id },
        data: updateData
      });
      
      return reply.send(insurance);
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
      description: 'Delete insurance policy',
      tags: ['insurance'],
      security: [{ Bearer: [] }]
    },
    preHandler: [(fastify as any).authorize(['ADVISOR'])]
  }, async (request: any, reply) => {
    const { id } = request.params;
    
    const existing = await prisma.insurance.findFirst({
      where: {
        id,
      }
    });
    
    if (!existing) {
      return reply.status(404).send({ message: 'Insurance not found' });
    }
    
    await prisma.insurance.delete({ where: { id } });
    
    return reply.status(204).send();
  });
}