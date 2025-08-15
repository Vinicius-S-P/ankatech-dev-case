import { Request, Response } from 'express';
import { allocationController } from '../../src/controllers/allocationController';

jest.mock('@prisma/client', () => {
  const mockPrismaAllocation = {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      allocation: mockPrismaAllocation,
    })),
    mockPrismaAllocation,
  };
});

describe('AllocationController', () => {
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
    it('should create a new allocation with valid data', async () => {
      const allocationData = {
        id: '1',
        totalAllocated: 100000,
        emergencyExpected: 10000,
        emergencyActual: 9500,
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockRequest.body = {
        totalAllocated: 100000,
        emergencyExpected: 10000,
        emergencyActual: 9500,
      };
      
      mockPrisma.allocation.create.mockResolvedValue(allocationData);
      
      await allocationController.create(mockRequest as Request, mockResponse as Response);
      
      expect(mockPrisma.allocation.create).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(allocationData);
    });

    it('should return 400 for invalid data', async () => {
      mockRequest.body = {
        totalAllocated: -1000,
      };
      
      await allocationController.create(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should return 500 on database error', async () => {
      mockRequest.body = {
        totalAllocated: 100000,
      };
      
      mockPrisma.allocation.create.mockRejectedValue(new Error('Database error'));
      
      await allocationController.create(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('getCurrent', () => {
    it('should return the current allocation', async () => {
      const allocationData = {
        id: '1',
        totalAllocated: 100000,
        emergencyExpected: 10000,
        emergencyActual: 9500,
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockPrisma.allocation.findFirst.mockResolvedValue(allocationData);
      
      await allocationController.getCurrent(mockRequest as Request, mockResponse as Response);
      
      expect(mockPrisma.allocation.findFirst).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(allocationData);
    });

    it('should return 404 when no allocation is found', async () => {
      mockPrisma.allocation.findFirst.mockResolvedValue(null);
      
      await allocationController.getCurrent(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'No allocation found' });
    });

    it('should return 500 on database error', async () => {
      mockPrisma.allocation.findFirst.mockRejectedValue(new Error('Database error'));
      
      await allocationController.getCurrent(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('getHistory', () => {
    it('should return allocation history', async () => {
      const allocations = [
        {
          id: '1',
          totalAllocated: 100000,
          emergencyExpected: 10000,
          emergencyActual: 9500,
          date: new Date('2023-01-01'),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          totalAllocated: 110000,
          emergencyExpected: 11000,
          emergencyActual: 10500,
          date: new Date('2023-02-01'),
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];
      
      mockRequest.query = {};
      mockPrisma.allocation.findMany.mockResolvedValue(allocations);
      
      await allocationController.getHistory(mockRequest as Request, mockResponse as Response);
      
      expect(mockPrisma.allocation.findMany).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(allocations);
    });

    it('should filter by date range when provided', async () => {
      mockRequest.query = {
        startDate: '2023-01-01T00:00:00Z',
        endDate: '2023-12-31T23:59:59Z'
      };
      
      mockPrisma.allocation.findMany.mockResolvedValue([]);
      
      await allocationController.getHistory(mockRequest as Request, mockResponse as Response);
      
      expect(mockPrisma.allocation.findMany).toHaveBeenCalledWith({
        where: {
          date: {
            gte: new Date('2023-01-01T00:00:00Z'),
            lte: new Date('2023-12-31T23:59:59Z')
          }
        },
        orderBy: { date: 'desc' },
        take: 50
      });
    });

    it('should return 500 on database error', async () => {
      mockRequest.query = {};
      mockPrisma.allocation.findMany.mockRejectedValue(new Error('Database error'));
      
      await allocationController.getHistory(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('update', () => {
    it('should update an allocation with valid data', async () => {
      const updatedAllocation = {
        id: '1',
        totalAllocated: 120000,
        emergencyExpected: 12000,
        emergencyActual: 11500,
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockRequest.params = { id: '1' };
      mockRequest.body = {
        totalAllocated: 120000,
        emergencyExpected: 12000,
      };
      
      mockPrisma.allocation.update.mockResolvedValue(updatedAllocation);
      
      await allocationController.update(mockRequest as Request, mockResponse as Response);
      
      expect(mockPrisma.allocation.update).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(updatedAllocation);
    });

    it('should return 400 for invalid data', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = {
        totalAllocated: -1000, // Invalid: negative value
      };
      
      await allocationController.update(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should return 500 on database error', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = {
        totalAllocated: 120000,
      };
      
      mockPrisma.allocation.update.mockRejectedValue(new Error('Database error'));
      
      await allocationController.update(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('delete', () => {
    it('should delete an allocation', async () => {
      mockRequest.params = { id: '1' };
      mockPrisma.allocation.delete.mockResolvedValue({});
      
      await allocationController.delete(mockRequest as Request, mockResponse as Response);
      
      expect(mockPrisma.allocation.delete).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should return 500 on database error', async () => {
      mockRequest.params = { id: '1' };
      mockPrisma.allocation.delete.mockRejectedValue(new Error('Database error'));
      
      await allocationController.delete(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });
});