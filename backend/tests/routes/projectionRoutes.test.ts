// import Fastify from 'fastify';
// import projectionRoutes from '../../src/routes/projectionRoutes';
// import { simulateWealthCurve } from '../../src/services/projectionEngine';

// jest.mock('../../src/services/projectionEngine', () => ({
//   simulateWealthCurve: jest.fn(),
//   calculateRequiredContribution: jest.fn(),
// }));

// jest.mock('../../src/services/suggestionEngine', () => ({
//   generateSuggestions: jest.fn(),
// }));

// jest.mock('../../src/services/projectionEngine', () => ({
//   simulateWealthCurve: jest.fn(),
//   calculateRequiredContribution: jest.fn(),
// }));

// jest.mock('../../src/services/suggestionEngine', () => ({
//   generateSuggestions: jest.fn(),
// }));

// jest.mock('@prisma/client', () => {
//   const mockPrismaClient = {
//     findUnique: jest.fn(),
//   };
  
//   const mockPrismaGoal = {
//     findMany: jest.fn(),
//   };
  
//   return {
//     PrismaClient: jest.fn().mockImplementation(() => ({
//       client: mockPrismaClient,
//       goal: mockPrismaGoal,
//     })),
//     mockPrismaClient,
//     mockPrismaGoal,
//   };
// });

// describe('Projection Routes', () => {
//   let fastify: any;
//   let mockPrisma: any;
  
//   beforeAll(() => {
//     const { PrismaClient } = require('@prisma/client');
//     mockPrisma = new PrismaClient();
//   });
  
//   beforeEach(() => {
//     fastify = Fastify();
//     fastify.register(projectionRoutes);
    
//     fastify.decorate('authenticate', async (_request: any, _reply: any) => {
//     });
    
//     jest.clearAllMocks();
//   });
  
//   afterEach(async () => {
//     await fastify.close();
//   });

//   // describe('POST /wealth-curve', () => {
//   //   it('should generate wealth curve projection', async () => {
//   //     const projectionData = [
//   //       {
//   //         year: 2023,
//   //         startValue: 100000,
//   //         endValue: 104000,
//   //         contribution: 12000,
//   //         withdrawal: 0,
//   //         growth: 4000,
//   //         events: [],
//   //         totalGoalProgress: 10000,
//   //       }
//   //     ];
      
//   //     const clientData = {
//   //       id: 'client-1',
//   //       name: 'Test Client',
//   //       email: 'test@example.com',
//   //       age: 35,
//   //     };
      
//   //     mockPrisma.client.findUnique.mockResolvedValue(clientData);
//   //     (simulateWealthCurve as jest.Mock).mockResolvedValue(projectionData);
      
//   //     const response = await fastify.inject({
//   //       method: 'POST',
//   //       url: '/wealth-curve',
//   //       headers: {
//   //         authorization: 'Bearer token',
//   //         'content-type': 'application/json'
//   //       },
//   //       payload: {
//   //         clientId: 'client-1',
//   //         realRate: 0.04,
//   //         startYear: 2023,
//   //         endYear: 2030,
//   //         includeEvents: true,
//   //       }
//   //     });
      
//   //     expect(response.statusCode).toBe(200);
//   //     expect(JSON.parse(response.body)).toEqual({ projection: projectionData });
//   //     expect(simulateWealthCurve).toHaveBeenCalled();
//   //   });
    
//     // it('should return 400 for invalid data', async () => {
//     //   const response = await fastify.inject({
//     //     method: 'POST',
//     //     url: '/wealth-curve',
//     //     headers: {
//     //       authorization: 'Bearer token',
//     //       'content-type': 'application/json'
//     //     },
//     //     payload: {
//     //       clientId: '', // Empty clientId
//     //       realRate: 1.5, // Rate too high
//     //       startYear: 1900, // Year too low
//     //       endYear: 2200, // Year too high
//     //     }
//     //   });
      
//     //   expect(response.statusCode).toBe(400);
//     // });
    
//   //   it('should return 404 for non-existent client', async () => {
//   //     mockPrisma.client.findUnique.mockResolvedValue(null);
      
//   //     const response = await fastify.inject({
//   //       method: 'POST',
//   //       url: '/wealth-curve',
//   //       headers: {
//   //         authorization: 'Bearer token',
//   //         'content-type': 'application/json'
//   //       },
//   //       payload: {
//   //         clientId: 'non-existent',
//   //         realRate: 0.04,
//   //         endYear: 2030,
//   //       }
//   //     });
      
//   //     expect(response.statusCode).toBe(404);
//   //     expect(JSON.parse(response.body)).toEqual({ message: 'Client not found' });
//   //   });
//   // });

//   // describe('POST /contribution-plan', () => {
//   //   it('should generate contribution plan', async () => {
//   //     const contributionPlan = {
//   //       requiredMonthlyContribution: 2000,
//   //       yearsToTarget: 10,
//   //       targetValue: 500000,
//   //       currentValue: 100000,
//   //       monthlyReturnRate: 0.0033,
//   //     };
      
//   //     const goalData = [
//   //       {
//   //         id: 'goal-1',
//   //         clientId: 'client-1',
//   //         type: 'RETIREMENT',
//   //         name: 'Retirement Goal',
//   //         targetValue: 500000,
//   //         currentValue: 100000,
//   //         targetDate: new Date('2033-12-31'),
//   //       }
//   //     ];
      
//   //     mockPrisma.goal.findMany.mockResolvedValue(goalData);
//   //     (calculateRequiredContribution as jest.Mock).mockResolvedValue(contributionPlan);
      
//   //     const response = await fastify.inject({
//   //       method: 'POST',
//   //       url: '/contribution-plan',
//   //       headers: {
//   //         authorization: 'Bearer token',
//   //         'content-type': 'application/json'
//   //       },
//   //       payload: {
//   //         clientId: 'client-1',
//   //         goalId: 'goal-1',
//   //         preferredMonthlyAmount: 2000,
//   //         realRate: 0.04,
//   //       }
//   //     });
      
//   //     expect(response.statusCode).toBe(200);
//   //     expect(JSON.parse(response.body)).toEqual(contributionPlan);
//   //     expect(calculateRequiredContribution).toHaveBeenCalled();
//   //   });
    
//   //   it('should return 400 for invalid data', async () => {
//   //     const response = await fastify.inject({
//   //       method: 'POST',
//   //       url: '/contribution-plan',
//   //       headers: {
//   //         authorization: 'Bearer token',
//   //         'content-type': 'application/json'
//   //       },
//   //       payload: {
//   //         clientId: '', // Empty clientId
//   //         goalId: '', // Empty goalId
//   //         preferredMonthlyAmount: -1000, // Negative amount
//   //         realRate: 1.5, // Rate too high
//   //       }
//   //     });
      
//   //     expect(response.statusCode).toBe(400);
//   //   });
//   // });

//   // describe('GET /suggestions/:clientId', () => {
//   //   it('should generate financial suggestions', async () => {
//   //     const suggestions = [
//   //       {
//   //         id: 'suggestion-1',
//   //         type: 'CONTRIBUTION_INCREASE',
//   //         priority: 'HIGH',
//   //         title: 'Increase Monthly Contributions',
//   //         description: 'Consider increasing your monthly contributions by 20%',
//   //         impact: 'Could accelerate goal achievement by 2 years',
//   //         actionRequired: {
//   //           amount: 500,
//   //           frequency: 'MONTHLY',
//   //         },
//   //         reasoning: 'Based on current projections, additional contributions would...',
//   //         potentialGain: 50000,
//   //         confidence: 85,
//   //       }
//   //     ];
      
//   //     const clientData = {
//   //       id: 'client-1',
//   //       name: 'Test Client',
//   //       email: 'test@example.com',
//   //       age: 35,
//   //     };
      
//   //     mockPrisma.client.findUnique.mockResolvedValue(clientData);
//   //     (generateSuggestions as jest.Mock).mockResolvedValue(suggestions);
      
//   //     const response = await fastify.inject({
//   //       method: 'GET',
//   //       url: '/suggestions/client-1',
//   //       headers: {
//   //         authorization: 'Bearer token'
//   //       }
//   //     });
      
//   //     expect(response.statusCode).toBe(200);
//   //     expect(JSON.parse(response.body)).toEqual({ suggestions });
//   //     expect(generateSuggestions).toHaveBeenCalled();
//   //   });
    
//   //   it('should return 404 for non-existent client', async () => {
//   //     mockPrisma.client.findUnique.mockResolvedValue(null);
      
//   //     const response = await fastify.inject({
//   //       method: 'GET',
//   //       url: '/suggestions/non-existent',
//   //       headers: {
//   //         authorization: 'Bearer token'
//   //       }
//   //     });
      
//   //     expect(response.statusCode).toBe(404);
//   //     expect(JSON.parse(response.body)).toEqual({ message: 'Client not found' });
//   //   });
//   // });

//   // describe('Error Handling', () => {
//   //   it('should handle projection engine errors', async () => {
//   //     const clientData = {
//   //       id: 'client-1',
//   //       name: 'Test Client',
//   //       email: 'test@example.com',
//   //       age: 35,
//   //     };
      
//   //     mockPrisma.client.findUnique.mockResolvedValue(clientData);
//   //     (simulateWealthCurve as jest.Mock).mockRejectedValue(new Error('Projection failed'));
      
//   //     const response = await fastify.inject({
//   //       method: 'POST',
//   //       url: '/wealth-curve',
//   //       headers: {
//   //         authorization: 'Bearer token',
//   //         'content-type': 'application/json'
//   //       },
//   //       payload: {
//   //         clientId: 'client-1',
//   //         realRate: 0.04,
//   //         endYear: 2030,
//   //       }
//   //     });
      
//   //     expect(response.statusCode).toBe(500);
//   //     expect(JSON.parse(response.body)).toEqual({ message: 'Internal server error' });
//   //   });
    
//     // it('should handle suggestion engine errors', async () => {
//     //   const clientData = {
//     //     id: 'client-1',
//     //     name: 'Test Client',
//     //     email: 'test@example.com',
//     //     age: 35,
//     //   };
      
//     //   mockPrisma.client.findUnique.mockResolvedValue(clientData);
//     //   (generateSuggestions as jest.Mock).mockRejectedValue(new Error('Suggestion generation failed'));
      
//     //   const response = await fastify.inject({
//     //     method: 'GET',
//     //     url: '/suggestions/client-1',
//     //     headers: {
//     //       authorization: 'Bearer token'
//     //     }
//     //   });
      
//     //   expect(response.statusCode).toBe(500);
//     //   expect(JSON.parse(response.body)).toEqual({ message: 'Internal server error' });
//     // });
//   });
// });