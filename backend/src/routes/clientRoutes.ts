import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CivilStatus = z.enum(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"]);
const ChildrenStatus = z.enum(["HAS_CHILDREN", "NO_CHILDREN"]);
const DependantsStatus = z.enum(["HAS_DEPENDANTS", "NO_DEPENDANTS"]);

const createClientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().int().min(18).max(120),
  active: z.boolean().optional(),
  familyProfile: z.array(z.union([CivilStatus, ChildrenStatus, DependantsStatus])),
  totalWealth: z.number().min(0, "Patrimônio não pode ser negativo").optional(),
});

const updateClientSchema = createClientSchema.partial();

const querySchema = z.object({
  active: z.string().transform(val => val === 'true').optional(),
  search: z.string().optional(),
  page: z.union([z.string(), z.number()]).transform(Number).default(1),
  limit: z.union([z.string(), z.number()]).transform(Number).default(10),
  sortBy: z.enum(['name', 'email', 'age', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export default async function clientRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
) {
  fastify.get('/', {
    schema: {
      description: 'List all clients with pagination and filters',
      tags: ['clients'],
      security: [{ Bearer: [] }],
      querystring: {
        type: 'object',
        properties: {
          active: { type: 'boolean' },
          search: { type: 'string' },
          page: { type: 'integer', minimum: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100 },
          sortBy: { type: 'string', enum: ['name', 'email', 'age', 'createdAt'] },
          sortOrder: { type: 'string', enum: ['asc', 'desc'] }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            clients: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string' },
                  age: { type: 'integer' },
                  active: { type: 'boolean' },
                  familyProfile: { type: 'array', items: { type: 'string' }, nullable: true },
                  totalWealth: { type: 'number' },
                  alignmentPercentage: { type: 'number' },
                  _count: {
                    type: 'object',
                    properties: {
                      goals: { type: 'integer' },
                      wallets: { type: 'integer' },
                      events: { type: 'integer' }
                    }
                  }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                totalPages: { type: 'integer' }
              }
            }
          }
        }
      }
    },
    preHandler: [(fastify as any).authenticate]
  }, async (request, reply) => {
    try {
      const query = querySchema.parse(request.query);
      
      const where: any = {};
      
      if (query.active !== undefined) {
        where.active = query.active;
      }
      
      if (query.search) {
        where.OR = [
          { name: { contains: query.search } },
          { email: { contains: query.search } }
        ];
      }

      const total = await prisma.client.count({ where });
      
      const clients = await prisma.client.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { [query.sortBy]: query.sortOrder },
        include: {
          _count: {
            select: {
              goals: true,
              wallets: true,
              events: true
            }
          }
        }
      });
      
      return reply.send({
        clients,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit)
        }
      });
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
  
  fastify.get('/:id', {
    schema: {
      description: 'Get client by ID with full details',
      tags: ['clients'],
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            age: { type: 'integer' },
            active: { type: 'boolean' },
            familyProfile: { type: 'array', items: { type: 'string' }, nullable: true },
            totalWealth: { type: 'number' },
            alignmentPercentage: { type: 'number' },
            goals: { type: 'array' },
            wallets: { type: 'array' },
            recentEvents: { type: 'array' }
          }
        },
        404: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    },
    preHandler: [(fastify as any).authenticate]
  }, async (request: any, reply) => {
    const { id } = request.params;
    
    const client = await prisma.client.findFirst({
      where: { 
        id
      },
      include: {
        goals: {
          orderBy: { targetDate: 'asc' }
        },
        wallets: {
          orderBy: { percentage: 'desc' }
        },
        events: {
          where: {
            startDate: {
              gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
            }
          },
          orderBy: { startDate: 'desc' },
          take: 10
        }
      }
    });
    
    if (!client) {
      return reply.status(404).send({
        message: 'Client not found'
      });
    }
    
    return reply.send({
      ...client,
      recentEvents: client.events
    });
  });
  
  fastify.post('/', {
    schema: {
      description: 'Create a new client',
      tags: ['clients'],
      security: [{ Bearer: [] }],
      body: {
        type: 'object',
        required: ['name', 'email', 'age'],
        properties: {
          name: { type: 'string', minLength: 1 },
          email: { type: 'string', format: 'email' },
          age: { type: 'integer', minimum: 18, maximum: 120 },
          active: { type: 'boolean' },
          familyProfile: { type: 'array', items: { type: 'string' } },
          totalWealth: { type: 'number' },
          alignmentPercentage: { type: 'number' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            age: { type: 'integer' },
            active: { type: 'boolean' },
            familyProfile: { type: 'array', items: { type: 'string' } },
          }
        }
      }
    },
    preHandler: [(fastify as any).authorize(['ADVISOR'])],
  }, async (request: any, reply) => {
    try {
      const data = createClientSchema.parse(request.body);
      
      const existing = await prisma.client.findUnique({
        where: { email: data.email }
      });
      
      if (existing) {
        return reply.status(400).send({
          message: 'Email already in use'
        });
      }
      
      const client = await prisma.client.create({
        data: {
          ...data
        }
      });
      
      return reply.status(201).send(client);
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
      description: 'Update client information',
      tags: ['clients'],
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1 },
          email: { type: 'string', format: 'email' },
          age: { type: 'integer', minimum: 18, maximum: 120 },
          active: { type: 'boolean' },
          familyProfile: { type: 'array', items: { type: 'string' } },
          totalWealth: { type: 'number' },
          alignmentPercentage: { type: 'number' }
        }
      },
    },
    preHandler: [(fastify as any).authorize(['ADVISOR'])],
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      const data = updateClientSchema.parse(request.body);
      
      const existing = await prisma.client.findFirst({
        where: { id }
      });
      
      if (!existing) {
        return reply.status(404).send({
          message: 'Client not found'
        });
      }
      
      if (data.email && data.email !== existing.email) {
        const emailExists = await prisma.client.findUnique({
          where: { email: data.email }
        });
        
        if (emailExists) {
          return reply.status(400).send({
            message: 'Email already in use'
          });
        }
      }
      
      const client = await prisma.client.update({
        where: { id },
        data
      });
      
      return reply.send(client);
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
      description: 'Delete a client',
      tags: ['clients'],
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      },
      response: {
        204: {
          type: 'null'
        }
      }
    },
    preHandler: [(fastify as any).authorize(['ADVISOR'])],
  }, async (request: any, reply) => {
    const { id } = request.params;
    
    const existing = await prisma.client.findFirst({
      where: { id }
    });
    
    if (!existing) {
      return reply.status(404).send({
        message: 'Client not found'
      });
    }
    
    await prisma.client.delete({
      where: { id }
    });
    
    return reply.status(204).send();
  });
  
  fastify.get('/:id/alignment', {
    schema: {
      description: 'Calculate and return client alignment status',
      tags: ['clients'],
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            currentWealth: { type: 'number' },
            plannedWealth: { type: 'number' },
            alignmentPercentage: { type: 'number' },
            suggestions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  message: { type: 'string' },
                  impact: { type: 'string' }
                }
              }
            }
          }
        }
      }
    },
    preHandler: [(fastify as any).authenticate]
  }, async (request: any, reply) => {
    const { id } = request.params;
    
    const client = await prisma.client.findFirst({
      where: { 
        id
      },
      include: {
        wallets: true,
        goals: true
      }
    });
    
    if (!client) {
      return reply.status(404).send({
        message: 'Client not found'
      });
    }
    
    const currentWealth = client.wallets.reduce((sum: number, wallet: any) => sum + wallet.currentValue, 0);
    
    const plannedWealth = client.goals.reduce((sum: number, goal: any) => sum + goal.targetValue, 0);
    
    const alignmentPercentage = currentWealth > 0 ? (currentWealth / plannedWealth) * 100 : 0;
    
    const suggestions = [];
    
    if (alignmentPercentage < 90) {
      const gap = plannedWealth - currentWealth;
      const monthlyIncrease = gap / 24;
      
      suggestions.push({
        type: 'INCREASE_CONTRIBUTION',
        message: `Aumente contribuição em R$ ${monthlyIncrease.toFixed(2)} por 24 meses`,
        impact: 'Alinhamento aumentará para 90%'
      });
    }
    
    await prisma.client.update({
      where: { id },
      data: {
        totalWealth: currentWealth,
        alignmentPercentage
      }
    });
    
    return reply.send({
      currentWealth,
      plannedWealth,
      alignmentPercentage,
      suggestions
    });
  });
}