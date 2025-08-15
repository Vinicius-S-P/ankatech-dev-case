// import Fastify from 'fastify';
// import authRoutes from '../../src/routes/authRoutes';
// import bcrypt from 'bcrypt';

// // Mock dependencies
// jest.mock('bcrypt');
// jest.mock('@prisma/client', () => {
//   const mockPrismaUser = {
//     findUnique: jest.fn(),
//     create: jest.fn(),
//   };
  
//   return {
//     PrismaClient: jest.fn().mockImplementation(() => ({
//       user: mockPrismaUser,
//     })),
//     mockPrismaUser,
//   };
// });

// // Mock JWT plugin
// jest.mock('fastify-jwt');

// describe('Auth Routes', () => {
//   let fastify: any;
//   let mockPrisma: any;
  
//   beforeAll(() => {
//     const { PrismaClient } = require('@prisma/client');
//     mockPrisma = new PrismaClient();
//   });
  
//   beforeEach(() => {
//     fastify = Fastify();
//     fastify.register(require('fastify-jwt'), { secret: 'test-secret' });
//     fastify.register(authRoutes);
    
//     jest.clearAllMocks();
//   });
  
//   afterEach(async () => {
//     await fastify.close();
//   });

//   describe('POST /register', () => {
//     it('should register a new user', async () => {
//       const userData = {
//         id: '1',
//         email: 'test@example.com',
//         name: 'Test User',
//         role: 'ADVISOR',
//       };
      
//       mockPrisma.user.findUnique.mockResolvedValue(null);
//       (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
//       mockPrisma.user.create.mockResolvedValue(userData);
      
//       const response = await fastify.inject({
//         method: 'POST',
//         url: '/register',
//         headers: {
//           'content-type': 'application/json'
//         },
//         payload: {
//           email: 'test@example.com',
//           password: 'password123',
//           name: 'Test User',
//           role: 'ADVISOR',
//         }
//       });
      
//       expect(response.statusCode).toBe(201);
//       const responseBody = JSON.parse(response.body);
//       expect(responseBody.user).toEqual(userData);
//       expect(responseBody.token).toBeDefined();
//     });
    
//     it('should return 400 for invalid data', async () => {
//       const response = await fastify.inject({
//         method: 'POST',
//         url: '/register',
//         headers: {
//           'content-type': 'application/json'
//         },
//         payload: {
//           email: 'invalid-email', // Invalid email
//           password: '123', // Too short password
//           name: '', // Empty name
//         }
//       });
      
//       expect(response.statusCode).toBe(400);
//     });
    
//     it('should return 409 when user already exists', async () => {
//       mockPrisma.user.findUnique.mockResolvedValue({ id: '1', email: 'test@example.com' });
      
//       const response = await fastify.inject({
//         method: 'POST',
//         url: '/register',
//         headers: {
//           'content-type': 'application/json'
//         },
//         payload: {
//           email: 'test@example.com',
//           password: 'password123',
//           name: 'Test User',
//         }
//       });
      
//       expect(response.statusCode).toBe(409);
//       expect(JSON.parse(response.body)).toEqual({ message: 'User already exists' });
//     });
//   });

//   describe('POST /login', () => {
//     it('should login a user with valid credentials', async () => {
//       const user = {
//         id: '1',
//         email: 'test@example.com',
//         name: 'Test User',
//         role: 'ADVISOR',
//         password: 'hashed-password',
//       };
      
//       mockPrisma.user.findUnique.mockResolvedValue(user);
//       (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      
//       const response = await fastify.inject({
//         method: 'POST',
//         url: '/login',
//         headers: {
//           'content-type': 'application/json'
//         },
//         payload: {
//           email: 'test@example.com',
//           password: 'password123',
//         }
//       });
      
//       expect(response.statusCode).toBe(200);
//       const responseBody = JSON.parse(response.body);
//       expect(responseBody.user).toEqual({
//         id: '1',
//         email: 'test@example.com',
//         name: 'Test User',
//         role: 'ADVISOR',
//       });
//       expect(responseBody.token).toBeDefined();
//     });
    
//     it('should return 401 for invalid credentials', async () => {
//       mockPrisma.user.findUnique.mockResolvedValue(null);
      
//       const response = await fastify.inject({
//         method: 'POST',
//         url: '/login',
//         headers: {
//           'content-type': 'application/json'
//         },
//         payload: {
//           email: 'nonexistent@example.com',
//           password: 'wrongpassword',
//         }
//       });
      
//       expect(response.statusCode).toBe(401);
//       expect(JSON.parse(response.body)).toEqual({ message: 'Invalid credentials' });
//     });
    
//     it('should return 401 for incorrect password', async () => {
//       const user = {
//         id: '1',
//         email: 'test@example.com',
//         name: 'Test User',
//         role: 'ADVISOR',
//         password: 'hashed-password',
//       };
      
//       mockPrisma.user.findUnique.mockResolvedValue(user);
//       (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      
//       const response = await fastify.inject({
//         method: 'POST',
//         url: '/login',
//         headers: {
//           'content-type': 'application/json'
//         },
//         payload: {
//           email: 'test@example.com',
//           password: 'wrongpassword',
//         }
//       });
      
//       expect(response.statusCode).toBe(401);
//       expect(JSON.parse(response.body)).toEqual({ message: 'Invalid credentials' });
//     });
    
//     it('should return 400 for invalid data', async () => {
//       const response = await fastify.inject({
//         method: 'POST',
//         url: '/login',
//         headers: {
//           'content-type': 'application/json'
//         },
//         payload: {
//           email: 'invalid-email', // Invalid email format
//           password: '', // Empty password
//         }
//       });
      
//       expect(response.statusCode).toBe(400);
//     });
//   });

//   describe('GET /me', () => {
//     it('should return current user information', async () => {
//       const user = {
//         id: '1',
//         email: 'test@example.com',
//         name: 'Test User',
//         role: 'ADVISOR',
//       };
      
//       // Mock authentication
//       fastify.addHook('preHandler', (_req: any, _reply: any, done: any) => {
//         done();
//       });
      
//       const response = await fastify.inject({
//         method: 'GET',
//         url: '/me',
//         headers: {
//           authorization: 'Bearer mock-token'
//         }
//       });
      
//       expect(response.statusCode).toBe(200);
//       expect(JSON.parse(response.body)).toEqual(user);
//     });
//   });
// });