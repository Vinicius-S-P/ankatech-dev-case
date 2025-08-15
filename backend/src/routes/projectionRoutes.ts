import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { 
  simulateWealthCurve, 
  calculateRequiredContribution 
} from '../services/projectionEngine';
import { generateSuggestions } from '../services/suggestionEngine';

const prisma = new PrismaClient();

const projectionSchema = z.object({
  clientId: z.string(),
  realRate: z.number().min(0).max(0.5).default(0.04),
  startYear: z.number().min(2020).max(2100).optional(),
  endYear: z.number().min(2020).max(2100).default(2060),
  includeEvents: z.boolean().default(true)
});

const contributionPlanSchema = z.object({
  clientId: z.string(),
  goalId: z.string(),
  preferredMonthlyAmount: z.number().positive().optional(),
  realRate: z.number().min(0).max(0.5).default(0.04)
});

export default async function projectionRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
) {
  fastify.post('/simulate', {
    schema: {
      description: 'Generate wealth projection curve for a client',
      tags: ['projections'],
      security: [{ Bearer: [] }],
      body: {
        type: 'object',
        required: ['clientId'],
        properties: {
          clientId: { type: 'string' },
          realRate: { type: 'number', default: 0.04 },
          startYear: { type: 'integer' },
          endYear: { type: 'integer', default: 2060 },
          includeEvents: { type: 'boolean', default: true }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            projections: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  year: { type: 'integer' },
                  startValue: { type: 'number' },
                  endValue: { type: 'number' },
                  contribution: { type: 'number' },
                  withdrawal: { type: 'number' },
                  growth: { type: 'number' },
                  events: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        type: { type: 'string' },
                        value: { type: 'number' },
                        description: { type: 'string' }
                      }
                    }
                  },
                  totalGoalProgress: { type: 'number' }
                }
              }
            },
            summary: {
              type: 'object',
              properties: {
                initialWealth: { type: 'number' },
                finalWealth: { type: 'number' },
                totalGrowth: { type: 'number' },
                totalContributions: { type: 'number' },
                totalWithdrawals: { type: 'number' },
                annualizedReturn: { type: 'number' }
              }
            }
          }
        }
      }
    },
    preHandler: [(fastify as any).authenticate]
  }, async (request: any, reply) => {
    try {
      const data = projectionSchema.parse(request.body);
      
      const client = await prisma.client.findFirst({
        where: {
          id: data.clientId,
          ...(request.user.role === 'VIEWER' ? { advisorId: request.user.id } : {})
        },
        include: {
          wallets: true
        }
      });
      
      if (!client) {
        return reply.status(404).send({
          message: 'Client not found'
        });
      }
      
      const initialWealth = client.wallets.reduce(
        (sum, wallet) => sum + wallet.currentValue, 
        0
      );
      
      const projections = await simulateWealthCurve({
        ...data,
        initialWealth,
        startYear: data.startYear || new Date().getFullYear()
      });
      
      const finalProjection = projections[projections.length - 1];
      const totalYears = projections.length;
      const totalGrowth = finalProjection.endValue - initialWealth;
      const totalContributions = projections.reduce(
        (sum, p) => sum + p.contribution, 0
      );
      const totalWithdrawals = projections.reduce(
        (sum, p) => sum + p.withdrawal, 0
      );
      
      const annualizedReturn = initialWealth > 0 && totalYears > 0 
        ? Math.pow(finalProjection.endValue / initialWealth, 1 / totalYears) - 1
        : 0;
      
      return reply.send({
        projections,
        summary: {
          initialWealth,
          finalWealth: finalProjection.endValue,
          totalGrowth,
          totalContributions,
          totalWithdrawals,
          annualizedReturn
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
  
  fastify.post('/contribution-plans', {
    schema: {
      description: 'Generate contribution plans to reach a financial goal',
      tags: ['projections'],
      security: [{ Bearer: [] }],
      body: {
        type: 'object',
        required: ['clientId', 'goalId'],
        properties: {
          clientId: { type: 'string' },
          goalId: { type: 'string' },
          preferredMonthlyAmount: { type: 'number' },
          realRate: { type: 'number', default: 0.04 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            goal: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                targetValue: { type: 'number' },
                targetDate: { type: 'string', format: 'date-time' },
                currentValue: { type: 'number' }
              }
            },
            currentWealth: { type: 'number' },
            plans: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  monthlyAmount: { type: 'number' },
                  totalMonths: { type: 'integer' },
                  totalContribution: { type: 'number' },
                  finalValue: { type: 'number' },
                  strategy: { type: 'string' }
                }
              }
            }
          }
        }
      }
    },
    preHandler: [(fastify as any).authenticate]
  }, async (request: any, reply) => {
    try {
      const data = contributionPlanSchema.parse(request.body);
      
      const goal = await prisma.goal.findFirst({
        where: {
          id: data.goalId,
          clientId: data.clientId,
          client: {
            ...(request.user.role === 'VIEWER' ? { advisorId: request.user.id } : {})
          }
        },
        include: {
          client: {
            include: {
              wallets: true
            }
          }
        }
      });
      
      if (!goal) {
        return reply.status(404).send({
          message: 'Goal not found'
        });
      }
      
      const currentWealth = goal.client.wallets.reduce(
        (sum, wallet) => sum + wallet.currentValue, 
        0
      );
      
      const plans = generateSuggestions(
        goal.clientId,
      );
      
      return reply.send({
        goal: {
          id: goal.id,
          name: goal.name,
          targetValue: goal.targetValue,
          targetDate: goal.targetDate,
          currentValue: goal.currentValue
        },
        currentWealth,
        plans
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
  
  fastify.get('/required-contribution/:clientId/:goalId', {
    schema: {
      description: 'Calculate required monthly contribution to reach a goal',
      tags: ['projections'],
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        properties: {
          clientId: { type: 'string' },
          goalId: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          realRate: { type: 'number', default: 0.04 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            goal: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                targetValue: { type: 'number' },
                targetDate: { type: 'string', format: 'date-time' }
              }
            },
            currentWealth: { type: 'number' },
            monthsToGoal: { type: 'integer' },
            requiredMonthlyContribution: { type: 'number' },
            totalContribution: { type: 'number' },
            achievable: { type: 'boolean' }
          }
        }
      }
    },
    preHandler: [(fastify as any).authenticate]
  }, async (request: any, reply) => {
    const { clientId, goalId } = request.params;
    const { realRate = 0.04 } = request.query;
    
    const goal = await prisma.goal.findFirst({
      where: {
        id: goalId,
        clientId,
        client: {
          ...(request.user.role === 'VIEWER' ? { advisorId: request.user.id } : {})
        }
      },
      include: {
        client: {
          include: {
            wallets: true
          }
        }
      }
    });
    
    if (!goal) {
      return reply.status(404).send({
        message: 'Goal not found'
      });
    }
    
    const currentWealth = goal.client.wallets.reduce(
      (sum, wallet) => sum + wallet.currentValue, 
      0
    );
    
    const now = new Date();
    const monthsToGoal = Math.max(1,
      (goal.targetDate.getFullYear() - now.getFullYear()) * 12 + 
      (goal.targetDate.getMonth() - now.getMonth())
    );
    
    const requiredMonthlyContribution = calculateRequiredContribution(
      currentWealth,
      goal.targetValue,
      monthsToGoal / 12,
      realRate
    );
    
    return reply.send({
      goal: {
        name: goal.name,
        targetValue: goal.targetValue,
        targetDate: goal.targetDate
      },
      currentWealth,
      monthsToGoal,
      requiredMonthlyContribution,
      totalContribution: requiredMonthlyContribution * monthsToGoal,
      achievable: requiredMonthlyContribution > 0 && requiredMonthlyContribution < currentWealth * 0.5
    });
  });
  
  fastify.post('/save-simulation', {
    schema: {
      description: 'Save a projection simulation for future reference',
      tags: ['projections'],
      security: [{ Bearer: [] }],
      body: {
        type: 'object',
        required: ['clientId', 'name', 'parameters', 'results'],
        properties: {
          clientId: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          parameters: { type: 'object' },
          results: { type: 'array' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            version: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    preHandler: [(fastify as any).authenticate]
  }, async (request: any, reply) => {
    const { clientId, name, description, parameters, results } = request.body;
    
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        ...(request.user.role === 'VIEWER' ? { advisorId: request.user.id } : {})
      }
    });
    
    if (!client) {
      return reply.status(404).send({
        message: 'Client not found'
      });
    }
    
    const lastSimulation = await prisma.simulation.findFirst({
      where: { clientId },
      orderBy: { version: 'desc' }
    });
    
    const version = (lastSimulation?.version || 0) + 1;
    
    const simulation = await prisma.simulation.create({
      data: {
        clientId,
        name,
        description,
        parameters,
        results,
        version
      }
    });
    
    return reply.status(201).send({
      id: simulation.id,
      name: simulation.name,
      description: simulation.description,
      version: simulation.version,
      createdAt: simulation.createdAt
    });
  });
}
