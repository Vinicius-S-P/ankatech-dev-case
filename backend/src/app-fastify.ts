import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import jwt from '@fastify/jwt';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    },
    serializers: {
      req(request) {
        return {
          method: request.method,
          url: request.url,
          body: request.body,
          headers: request.headers
        };
      }
    }
  }
});

fastify.register(cors, {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
});

fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
  sign: {
    expiresIn: '7d'
  }
});

fastify.register(swagger, {
  swagger: {
    info: {
      title: 'Financial Planner API',
      description: 'API for Multi Family Office Financial Planning',
      version: '1.0.0'
    },
    externalDocs: {
      url: 'https://swagger.io',
      description: 'Find more info here'
    },
    host: 'localhost:4000',
    schemes: ['http'],
    consumes: ['application/json'],
    produces: ['application/json'],
    tags: [
      { name: 'auth', description: 'Authentication endpoints' },
      { name: 'clients', description: 'Client management endpoints' },
      { name: 'goals', description: 'Financial goals endpoints' },
      { name: 'wallets', description: 'Wallet management endpoints' },
      { name: 'events', description: 'Financial events endpoints' },
      { name: 'simulations', description: 'Simulation endpoints' },
      { name: 'projections', description: 'Projection endpoints' },
      { name: 'insurance', description: 'Insurance management endpoints' }
    ],
    securityDefinitions: {
      Bearer: {
        type: 'apiKey',
        name: 'Authorization',
        in: 'header',
        description: 'JWT Authorization header using the Bearer scheme. Example: "Bearer {token}"'
      }
    }
  }
});

fastify.register(swaggerUi, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: true
  },
  staticCSP: true,
  transformSpecificationClone: true
});

fastify.decorate('authenticate', async function(request: any, reply: any) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});

fastify.decorate('authorize', function(allowedRoles: string[]) {
  return async function(request: any, reply: any) {
    try {
      await request.jwtVerify();
      
      const userRole = request.user.role;
      if (!allowedRoles.includes(userRole)) {
        fastify.log.warn(`Access denied for user ${request.user.id} with role ${userRole}. Required: ${allowedRoles.join(', ')}`);
        return reply.code(403).send({ 
          error: 'Insufficient permissions',
          required: allowedRoles,
          current: userRole
        });
      }
      
      fastify.log.info(`Access granted for user ${request.user.id} with role ${userRole}`);
    } catch (err: any) {
      fastify.log.error('Authorization error:', err);
      return reply.code(401).send({ error: 'Authentication required' });
    }
  };
});

fastify.get('/health', {
  schema: {
    description: 'Health check endpoint',
    tags: ['health'],
    response: {
      200: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          timestamp: { type: 'string' },
          uptime: { type: 'number' }
        }
      }
    }
  }
}, async (_request, _reply) => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  };
});

import authRoutes from './routes/authRoutes';
import clientRoutes from './routes/clientRoutes';
import goalRoutes from './routes/goalRoutes';
import walletRoutes from './routes/walletRoutes';
import eventRoutes from './routes/eventRoutes';
import simulationRoutes from './routes/simulationRoutes';
import projectionRoutes from './routes/projectionRoutes';
import insuranceRoutes from './routes/insuranceRoutes';

fastify.register(authRoutes, { prefix: '/api/auth' });
fastify.register(clientRoutes, { prefix: '/api/clients' });
fastify.register(goalRoutes, { prefix: '/api/goals' });
fastify.register(walletRoutes, { prefix: '/api/wallets' });
fastify.register(eventRoutes, { prefix: '/api/events' });
fastify.register(simulationRoutes, { prefix: '/api/simulations' });
fastify.register(projectionRoutes, { prefix: '/api/projections' });
fastify.register(insuranceRoutes, { prefix: '/api/insurance' });

fastify.setErrorHandler(function (error: any, _request, reply) {
  if (error.validation) {
    reply.status(400).send({
      message: 'Validation Error',
      errors: error.validation
    });
  } else if (error.statusCode) {
    reply.status(error.statusCode).send({
      message: error.message
    });
  } else {
    fastify.log.error(error);
    reply.status(500).send({
      message: 'Internal Server Error'
    });
  }
});

const closeGracefully = async (signal: string) => {
  fastify.log.info(`Received signal ${signal}, shutting down gracefully...`);
  await fastify.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', () => closeGracefully('SIGINT'));
process.on('SIGTERM', () => closeGracefully('SIGTERM'));

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '4000');
    const host = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    
    fastify.log.info(`Server listening at http://${host}:${port}`);
    fastify.log.info(`API Documentation available at http://${host}:${port}/docs`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

if (require.main === module) {
  start();
}

export default fastify;

if (process.env.NODE_ENV !== 'test') {
  start();
}
