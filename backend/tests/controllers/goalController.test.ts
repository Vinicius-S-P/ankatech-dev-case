import { Request, Response } from 'express';
import { goalController } from '../../src/controllers/goalController';
import { GoalType } from '@prisma/client';

jest.mock('@prisma/client', () => {
  const mockPrismaGoal = {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  
  const { GoalType } = jest.requireActual('@prisma/client');
  
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      goal: mockPrismaGoal,
    })),
    GoalType,
    mockPrismaGoal,
  };
});

describe('GoalController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockPrisma: any;

  beforeEach(() => {
    const { PrismaClient } = require('@prisma/client');
    mockPrisma = new PrismaClient();
    
    mockRequest = {
      body: {},
      params: {},
      query: {},
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new goal with valid data', async () => {
      const goalData = {
        id: '1',
        clientId: 'client-1',
        type: GoalType.RETIREMENT,
        name: 'Retirement Goal',
        description: 'Retirement savings goal',
        targetValue: 1000000,
        targetDate: new Date('2050-12-31'),
        currentValue: 100000,
        monthlyIncome: 5000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockRequest.body = {
        clientId: 'client-1',
        type: 'RETIREMENT',
        name: 'Retirement Goal',
        description: 'Retirement savings goal',
        targetValue: 1000000,
        targetDate: '2050-12-31T00:00:00Z',
        currentValue: 100000,
        monthlyIncome: 5000,
      };
      
      mockPrisma.goal.create.mockResolvedValue(goalData);
      
      await goalController.create(mockRequest as Request, mockResponse as Response);
      
      expect(mockPrisma.goal.create).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(goalData);
    });

    it('should return 400 for invalid data', async () => {
      mockRequest.body = {
        clientId: 'client-1',
        type: 'INVALID_TYPE',
        name: 'Retirement Goal',
        targetValue: -1000,
        targetDate: '2050-12-31T00:00:00Z',
      };
      
      await goalController.create(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should return 500 on database error', async () => {
      mockRequest.body = {
        clientId: 'client-1',
        type: 'RETIREMENT',
        name: 'Retirement Goal',
        targetValue: 1000000,
        targetDate: '2050-12-31T00:00:00Z',
      };
      
      mockPrisma.goal.create.mockRejectedValue(new Error('Database error'));
      
      await goalController.create(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('findAll', () => {
    it('should return all goals', async () => {
      const goals = [
        {
          id: '1',
          clientId: 'client-1',
          type: GoalType.RETIREMENT,
          name: 'Retirement Goal',
          description: 'Retirement savings goal',
          targetValue: 1000000,
          targetDate: new Date('2050-12-31'),
          currentValue: 100000,
          monthlyIncome: 5000,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          clientId: 'client-1',
          type: GoalType.SHORT_TERM,
          name: 'Vacation Goal',
          description: 'Save for vacation',
          targetValue: 10000,
          targetDate: new Date('2024-12-31'),
          currentValue: 5000,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];
      
      mockPrisma.goal.findMany.mockResolvedValue(goals);
      
      await goalController.findAll(mockRequest as Request, mockResponse as Response);
      
      expect(mockPrisma.goal.findMany).toHaveBeenCalledWith({
        orderBy: { targetDate: 'desc' }
      });
      expect(mockResponse.json).toHaveBeenCalledWith(goals);
    });

    it('should return 500 on database error', async () => {
      mockPrisma.goal.findMany.mockRejectedValue(new Error('Database error'));
      
      await goalController.findAll(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('getCurrent', () => {
    it('should return the current goal with calculated fields', async () => {
      const goalData = {
        id: '1',
        clientId: 'client-1',
        type: GoalType.RETIREMENT,
        name: 'Retirement Goal',
        description: 'Retirement savings goal',
        targetValue: 1000000,
        targetDate: new Date('2050-12-31'),
        currentValue: 100000,
        monthlyIncome: 5000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockPrisma.goal.findFirst.mockResolvedValue(goalData);
      
      await goalController.getCurrent(mockRequest as Request, mockResponse as Response);
      
      expect(mockPrisma.goal.findFirst).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalled();
      const response = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(response).toHaveProperty('id', '1');
      expect(response).toHaveProperty('monthsToTarget');
      expect(response).toHaveProperty('monthlyContribution');
      expect(response).toHaveProperty('requiredMonthlyReturn');
      expect(response).toHaveProperty('projectedValue');
    });

    it('should return 404 when no goal is found', async () => {
      mockPrisma.goal.findFirst.mockResolvedValue(null);
      
      await goalController.getCurrent(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'No goal found' });
    });

    it('should return 500 on database error', async () => {
      mockPrisma.goal.findFirst.mockRejectedValue(new Error('Database error'));
      
      await goalController.getCurrent(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('findById', () => {
    it('should return a goal by id', async () => {
      const goalData = {
        id: '1',
        clientId: 'client-1',
        type: GoalType.RETIREMENT,
        name: 'Retirement Goal',
        description: 'Retirement savings goal',
        targetValue: 1000000,
        targetDate: new Date('2050-12-31'),
        currentValue: 100000,
        monthlyIncome: 5000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockRequest.params = { id: '1' };
      mockPrisma.goal.findUnique.mockResolvedValue(goalData);
      
      await goalController.findById(mockRequest as Request, mockResponse as Response);
      
      expect(mockPrisma.goal.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(mockResponse.json).toHaveBeenCalledWith(goalData);
    });

    it('should return 404 when goal is not found', async () => {
      mockRequest.params = { id: 'non-existent' };
      mockPrisma.goal.findUnique.mockResolvedValue(null);
      
      await goalController.findById(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Goal not found' });
    });

    it('should return 500 on database error', async () => {
      mockRequest.params = { id: '1' };
      mockPrisma.goal.findUnique.mockRejectedValue(new Error('Database error'));
      
      await goalController.findById(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('update', () => {
    it('should update a goal with valid data', async () => {
      const updatedGoal = {
        id: '1',
        clientId: 'client-1',
        type: GoalType.RETIREMENT,
        name: 'Updated Retirement Goal',
        description: 'Updated retirement savings goal',
        targetValue: 1200000,
        targetDate: new Date('2050-12-31'),
        currentValue: 150000,
        monthlyIncome: 6000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockRequest.params = { id: '1' };
      mockRequest.body = {
        name: 'Updated Retirement Goal',
        targetValue: 1200000,
        currentValue: 150000,
      };
      
      mockPrisma.goal.update.mockResolvedValue(updatedGoal);
      
      await goalController.update(mockRequest as Request, mockResponse as Response);
      
      expect(mockPrisma.goal.update).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(updatedGoal);
    });

    it('should return 400 for invalid data', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = {
        targetValue: -1000, // Invalid: negative value
      };
      
      await goalController.update(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should return 500 on database error', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = {
        name: 'Updated Retirement Goal',
      };
      
      mockPrisma.goal.update.mockRejectedValue(new Error('Database error'));
      
      await goalController.update(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('delete', () => {
    it('should delete a goal', async () => {
      mockRequest.params = { id: '1' };
      mockPrisma.goal.delete.mockResolvedValue({});
      
      await goalController.delete(mockRequest as Request, mockResponse as Response);
      
      expect(mockPrisma.goal.delete).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should return 500 on database error', async () => {
      mockRequest.params = { id: '1' };
      mockPrisma.goal.delete.mockRejectedValue(new Error('Database error'));
      
      await goalController.delete(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });
});