import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(['ADVISOR', 'VIEWER']).optional()
});

export default async function authRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Register endpoint
  fastify.post('/register', {
    schema: {
      description: 'Register a new user',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['email', 'password', 'name'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          name: { type: 'string', minLength: 1 },
          role: { type: 'string', enum: ['ADVISOR', 'VIEWER'] }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                role: { type: 'string' }
              }
            },
            token: { type: 'string' }
          }
        },
        400: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            errors: { type: 'object' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const data = registerSchema.parse(request.body);
      
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email }
      });
      
      if (existingUser) {
        return reply.status(400).send({
          message: 'User already exists'
        });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);
      
      // Create user
      const user = await prisma.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          name: data.name,
          role: data.role || 'VIEWER'
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true
        }
      });
      
      // Generate token
      const token = fastify.jwt.sign({
        id: user.id,
        email: user.email,
        role: user.role
      });
      
      return reply.status(201).send({
        user,
        token
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
  
  // Login endpoint
  fastify.post('/login', {
    schema: {
      description: 'Login with email and password',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                role: { type: 'string' }
              }
            },
            token: { type: 'string' }
          }
        },
        401: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const data = loginSchema.parse(request.body);
      
      // Find user
      const user = await prisma.user.findUnique({
        where: { email: data.email }
      });
      
      if (!user) {
        return reply.status(401).send({
          message: 'Invalid credentials'
        });
      }
      
      // Check password
      const validPassword = await bcrypt.compare(data.password, user.password);
      
      if (!validPassword) {
        return reply.status(401).send({
          message: 'Invalid credentials'
        });
      }
      
      // Check if user is active
      if (!user.active) {
        return reply.status(401).send({
          message: 'Account is deactivated'
        });
      }
      
      // Generate token
      const token = fastify.jwt.sign({
        id: user.id,
        email: user.email,
        role: user.role
      });
      
      return reply.send({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        token
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
  
  // Verify token endpoint
  fastify.get('/verify', {
    schema: {
      description: 'Verify JWT token',
      tags: ['auth'],
      security: [{ Bearer: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            valid: { type: 'boolean' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                role: { type: 'string' }
              }
            }
          }
        }
      }
    },
    preHandler: [(fastify as any).authenticate]
  }, async (request, reply) => {
    return reply.send({
      valid: true,
      user: (request as any).user
    });
  });
  
  // Refresh token endpoint
  fastify.post('/refresh', {
    schema: {
      description: 'Refresh JWT token',
      tags: ['auth'],
      security: [{ Bearer: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            token: { type: 'string' }
          }
        }
      }
    },
    preHandler: [(fastify as any).authenticate]
  }, async (request, reply) => {
    const user = (request as any).user;
    
    // Generate new token
    const token = fastify.jwt.sign({
      id: user.id,
      email: user.email,
      role: user.role
    });
    
    return reply.send({ token });
  });
}
