import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Schemas
const createClientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().int().min(18).max(120),
  active: z.boolean().optional(),
  familyProfile: z.string().optional()
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
  // Get all clients
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
                  familyProfile: { type: 'string', nullable: true },
                  totalWealth: { type: 'number' },
                  alignmentPercentage: { type: 'number' },
                  alignmentCategory: { type: 'string', nullable: true },
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
      
      // Build where clause
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
      
      // Get advisor filter if viewer role
      const user = (request as any).user;
      if (user.role === 'VIEWER') {
        where.advisorId = user.id;
      }
      
      // Count total
      const total = await prisma.client.count({ where });
      
      // Get clients
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
  
  // Get client by ID
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
            familyProfile: { type: 'string', nullable: true },
            totalWealth: { type: 'number' },
            alignmentPercentage: { type: 'number' },
            alignmentCategory: { type: 'string', nullable: true },
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
        id,
        ...(request.user.role === 'VIEWER' ? { advisorId: request.user.id } : {})
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
  
  // Create client
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
          familyProfile: { type: 'string' }
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
            familyProfile: { type: 'string', nullable: true }
          }
        }
      }
    },
    preHandler: [(fastify as any).authorize(['ADVISOR'])]
  }, async (request: any, reply) => {
    try {
      const data = createClientSchema.parse(request.body);
      
      // Check if email already exists
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
          ...data,
          advisorId: request.user.id
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
  
  // Update client
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
          familyProfile: { type: 'string' }
        }
      }
    },
    preHandler: [(fastify as any).authorize(['ADVISOR'])]
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      const data = updateClientSchema.parse(request.body);
      
      // Check if client exists and belongs to advisor
      const existing = await prisma.client.findFirst({
        where: { id, advisorId: request.user.id }
      });
      
      if (!existing) {
        return reply.status(404).send({
          message: 'Client not found'
        });
      }
      
      // Check email uniqueness if changing email
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
  
  // Delete client
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
    preHandler: [(fastify as any).authorize(['ADVISOR'])]
  }, async (request: any, reply) => {
    const { id } = request.params;
    
    // Check if client exists and belongs to advisor
    const existing = await prisma.client.findFirst({
      where: { id, advisorId: request.user.id }
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
  
  // Get client alignment status
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
            category: { type: 'string' },
            color: { type: 'string' },
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
        id,
        ...(request.user.role === 'VIEWER' ? { advisorId: request.user.id } : {})
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
    
    // Calculate current wealth
    const currentWealth = client.wallets.reduce((sum: number, wallet: any) => sum + wallet.currentValue, 0);
    
    // Calculate planned wealth (sum of goal target values)
    const plannedWealth = client.goals.reduce((sum: number, goal: any) => sum + goal.targetValue, 0);
    
    // Calculate alignment percentage
    const alignmentPercentage = currentWealth > 0 ? (currentWealth / plannedWealth) * 100 : 0;
    
    // Determine category and color
    let category: string;
    let color: string;
    
    if (alignmentPercentage > 90) {
      category = 'Alinhado';
      color = 'green';
    } else if (alignmentPercentage >= 70) {
      category = 'Parcialmente Alinhado';
      color = 'yellow-light';
    } else if (alignmentPercentage >= 50) {
      category = 'Desalinhado';
      color = 'yellow-dark';
    } else {
      category = 'Muito Desalinhado';
      color = 'red';
    }
    
    // Generate suggestions
    const suggestions = [];
    
    if (alignmentPercentage < 90) {
      const gap = plannedWealth - currentWealth;
      const monthlyIncrease = gap / 24; // Spread over 24 months
      
      suggestions.push({
        type: 'INCREASE_CONTRIBUTION',
        message: `Aumente contribuição em R$ ${monthlyIncrease.toFixed(2)} por 24 meses`,
        impact: 'Alinhamento aumentará para 90%'
      });
    }
    
    // Update client record
    await prisma.client.update({
      where: { id },
      data: {
        totalWealth: currentWealth,
        alignmentPercentage,
        alignmentCategory: category
      }
    });
    
    return reply.send({
      currentWealth,
      plannedWealth,
      alignmentPercentage,
      category,
      color,
      suggestions
    });
  });
}
