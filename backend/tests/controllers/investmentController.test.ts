import { Request, Response } from 'express';
import { investmentController } from '../../src/controllers/investmentController';

jest.mock('@prisma/client', () => {
  const mockPrismaInvestment = {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      investment: mockPrismaInvestment,
    })),
    mockPrismaInvestment,
  };
});

describe('InvestmentController', () => {
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
    
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new investment with valid data', async () => {
      const investmentData = {
        id: '1',
        name: 'Apple Stocks',
        type: 'STOCKS',
        assetType: 'EQUITY',
        currentValue: 10000,
        initialValue: 8000,
        percentChange: 25,
        allocation: 10,
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockRequest.body = {
        name: 'Apple Stocks',
        type: 'STOCKS',
        assetType: 'EQUITY',
        currentValue: 10000,
        initialValue: 8000,
        percentChange: 25,
        allocation: 10,
      };
      
      mockPrisma.investment.create.mockResolvedValue(investmentData);
      
      await investmentController.create(mockRequest as Request, mockResponse as Response);
      
      expect(mockPrisma.investment.create).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(investmentData);
    });

    it('should return 400 for invalid data', async () => {
      mockRequest.body = {
        name: '', // Invalid: empty string
        type: 'INVALID_TYPE', // Invalid enum value
        assetType: 'INVALID_ASSET_TYPE', // Invalid enum value
        currentValue: -1000, // Invalid: negative value
        initialValue: -8000, // Invalid: negative value
      };
      
      await investmentController.create(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should return 500 on database error', async () => {
      mockRequest.body = {
        name: 'Apple Stocks',
        type: 'STOCKS',
        assetType: 'EQUITY',
        currentValue: 10000,
        initialValue: 8000,
      };
      
      mockPrisma.investment.create.mockRejectedValue(new Error('Database error'));
      
      await investmentController.create(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('findAll', () => {
    it('should return all investments with summary', async () => {
      const investments = [
        {
          id: '1',
          name: 'Apple Stocks',
          type: 'STOCKS',
          assetType: 'FINANCEIRA',
          currentValue: 10000,
          initialValue: 8000,
          percentChange: 25,
          allocation: 10,
          date: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          name: 'Real Estate Fund',
          type: 'FUNDS',
          assetType: 'IMOBILIZADA',
          currentValue: 50000,
          initialValue: 45000,
          percentChange: 11,
          allocation: 50,
          date: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];
      
      mockRequest.query = {};
      mockPrisma.investment.findMany.mockResolvedValue(investments);
      
      await investmentController.findAll(mockRequest as Request, mockResponse as Response);
      
      expect(mockPrisma.investment.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { date: 'desc' }
      });
      expect(mockResponse.json).toHaveBeenCalled();
      const response = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(response).toHaveProperty('investments');
      expect(response).toHaveProperty('summary');
    });

    it('should filter by assetType and type when provided', async () => {
      mockRequest.query = {
        assetType: 'EQUITY',
        type: 'STOCKS'
      };
      
      mockPrisma.investment.findMany.mockResolvedValue([]);
      
      await investmentController.findAll(mockRequest as Request, mockResponse as Response);
      
      expect(mockPrisma.investment.findMany).toHaveBeenCalledWith({
        where: {
          assetType: 'EQUITY',
          type: 'STOCKS'
        },
        orderBy: { date: 'desc' }
      });
    });

    it('should return 500 on database error', async () => {
      mockRequest.query = {};
      mockPrisma.investment.findMany.mockRejectedValue(new Error('Database error'));
      
      await investmentController.findAll(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('findById', () => {
    it('should return an investment by id', async () => {
      const investmentData = {
        id: '1',
        name: 'Apple Stocks',
        type: 'STOCKS',
        assetType: 'EQUITY',
        currentValue: 10000,
        initialValue: 8000,
        percentChange: 25,
        allocation: 10,
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockRequest.params = { id: '1' };
      mockPrisma.investment.findUnique.mockResolvedValue(investmentData);
      
      await investmentController.findById(mockRequest as Request, mockResponse as Response);
      
      expect(mockPrisma.investment.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(mockResponse.json).toHaveBeenCalledWith(investmentData);
    });

    it('should return 404 when investment is not found', async () => {
      mockRequest.params = { id: 'non-existent' };
      mockPrisma.investment.findUnique.mockResolvedValue(null);
      
      await investmentController.findById(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Investment not found' });
    });

    it('should return 500 on database error', async () => {
      mockRequest.params = { id: '1' };
      mockPrisma.investment.findUnique.mockRejectedValue(new Error('Database error'));
      
      await investmentController.findById(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('update', () => {
    it('should update an investment with valid data', async () => {
      const updatedInvestment = {
        id: '1',
        name: 'Updated Apple Stocks',
        type: 'STOCKS',
        assetType: 'EQUITY',
        currentValue: 12000,
        initialValue: 8000,
        percentChange: 50,
        allocation: 12,
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockRequest.params = { id: '1' };
      mockRequest.body = {
        name: 'Updated Apple Stocks',
        currentValue: 12000,
        percentChange: 50,
      };
      
      mockPrisma.investment.update.mockResolvedValue(updatedInvestment);
      
      await investmentController.update(mockRequest as Request, mockResponse as Response);
      
      expect(mockPrisma.investment.update).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(updatedInvestment);
    });

    it('should return 400 for invalid data', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = {
        currentValue: -1000, // Invalid: negative value
      };
      
      await investmentController.update(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should return 500 on database error', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = {
        name: 'Updated Apple Stocks',
      };
      
      mockPrisma.investment.update.mockRejectedValue(new Error('Database error'));
      
      await investmentController.update(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('delete', () => {
    it('should delete an investment', async () => {
      mockRequest.params = { id: '1' };
      mockPrisma.investment.delete.mockResolvedValue({});
      
      await investmentController.delete(mockRequest as Request, mockResponse as Response);
      
      expect(mockPrisma.investment.delete).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should return 500 on database error', async () => {
      mockRequest.params = { id: '1' };
      mockPrisma.investment.delete.mockRejectedValue(new Error('Database error'));
      
      await investmentController.delete(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('getByAssetType', () => {
    it('should return investments grouped by asset type', async () => {
      const investments = [
        {
          id: '1',
          name: 'Apple Stocks',
          type: 'STOCKS',
          assetType: 'FINANCEIRA',
          currentValue: 10000,
          initialValue: 8000,
          percentChange: 25,
          allocation: 10,
          date: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          name: 'Real Estate Fund',
          type: 'FUNDS',
          assetType: 'IMOBILIZADA',
          currentValue: 50000,
          initialValue: 45000,
          percentChange: 11,
          allocation: 50,
          date: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];
      
      mockPrisma.investment.findMany.mockResolvedValue(investments);
      
      await investmentController.getByAssetType(mockRequest as Request, mockResponse as Response);
      
      expect(mockPrisma.investment.findMany).toHaveBeenCalledWith({
        orderBy: { date: 'desc' }
      });
      expect(mockResponse.json).toHaveBeenCalled();
      const response = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(response).toHaveProperty('financial');
      expect(response).toHaveProperty('realEstate');
      expect(response).toHaveProperty('total');
    });

    it('should return 500 on database error', async () => {
      mockPrisma.investment.findMany.mockRejectedValue(new Error('Database error'));
      
      await investmentController.getByAssetType(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });
});