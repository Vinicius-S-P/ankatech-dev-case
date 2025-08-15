import { Request, Response } from 'express';
import { kpiController } from '../../src/controllers/kpiController';

jest.mock('@prisma/client', () => {
  const mockPrismaKPIData = {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      kPIData: mockPrismaKPIData,
    })),
    mockPrismaKPIData,
  };
});

describe('KPIController', () => {
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
    it('should create a new KPI with valid data', async () => {
      const kpiData = {
        id: '1',
        category: 'Returns',
        percentage: 8.5,
        indexer: 'CDI',
        custody: 'Broker A',
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockRequest.body = {
        category: 'Returns',
        percentage: 8.5,
        indexer: 'CDI',
        custody: 'Broker A',
      };
      
      mockPrisma.kPIData.create.mockResolvedValue(kpiData);
      
      await kpiController.create(mockRequest as Request, mockResponse as Response);
      
      expect(mockPrisma.kPIData.create).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(kpiData);
    });

    it('should return 400 for invalid data', async () => {
      mockRequest.body = {
        category: '',
        percentage: 150,
      };
      
      await kpiController.create(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should return 500 on database error', async () => {
      mockRequest.body = {
        category: 'Returns',
        percentage: 8.5,
      };
      
      mockPrisma.kPIData.create.mockRejectedValue(new Error('Database error'));
      
      await kpiController.create(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('findAll', () => {
    it('should return all KPIs with summary', async () => {
      const kpis = [
        {
          id: '1',
          category: 'Returns',
          percentage: 8.5,
          indexer: 'CDI',
          custody: 'Broker A',
          date: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          category: 'Risk',
          percentage: 12.3,
          indexer: 'IBOVESPA',
          custody: 'Broker B',
          date: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];
      
      mockRequest.query = {};
      mockPrisma.kPIData.findMany.mockResolvedValue(kpis);
      
      await kpiController.findAll(mockRequest as Request, mockResponse as Response);
      
      expect(mockPrisma.kPIData.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { date: 'desc' }
      });
      expect(mockResponse.json).toHaveBeenCalled();
      const response = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(response).toHaveProperty('kpis');
      expect(response).toHaveProperty('summary');
    });

    it('should filter by category, indexer, and custody when provided', async () => {
      mockRequest.query = {
        category: 'Returns',
        indexer: 'CDI',
        custody: 'Broker A'
      };
      
      mockPrisma.kPIData.findMany.mockResolvedValue([]);
      
      await kpiController.findAll(mockRequest as Request, mockResponse as Response);
      
      expect(mockPrisma.kPIData.findMany).toHaveBeenCalledWith({
        where: {
          category: 'Returns',
          indexer: 'CDI',
          custody: 'Broker A'
        },
        orderBy: { date: 'desc' }
      });
    });

    it('should return 500 on database error', async () => {
      mockRequest.query = {};
      mockPrisma.kPIData.findMany.mockRejectedValue(new Error('Database error'));
      
      await kpiController.findAll(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('findById', () => {
    it('should return a KPI by id', async () => {
      const kpiData = {
        id: '1',
        category: 'Returns',
        percentage: 8.5,
        indexer: 'CDI',
        custody: 'Broker A',
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockRequest.params = { id: '1' };
      mockPrisma.kPIData.findUnique.mockResolvedValue(kpiData);
      
      await kpiController.findById(mockRequest as Request, mockResponse as Response);
      
      expect(mockPrisma.kPIData.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(mockResponse.json).toHaveBeenCalledWith(kpiData);
    });

    it('should return 404 when KPI is not found', async () => {
      mockRequest.params = { id: 'non-existent' };
      mockPrisma.kPIData.findUnique.mockResolvedValue(null);
      
      await kpiController.findById(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'KPI not found' });
    });

    it('should return 500 on database error', async () => {
      mockRequest.params = { id: '1' };
      mockPrisma.kPIData.findUnique.mockRejectedValue(new Error('Database error'));
      
      await kpiController.findById(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('update', () => {
    it('should update a KPI with valid data', async () => {
      const updatedKPI = {
        id: '1',
        category: 'Updated Returns',
        percentage: 9.2,
        indexer: 'CDI',
        custody: 'Broker A',
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockRequest.params = { id: '1' };
      mockRequest.body = {
        category: 'Updated Returns',
        percentage: 9.2,
      };
      
      mockPrisma.kPIData.update.mockResolvedValue(updatedKPI);
      
      await kpiController.update(mockRequest as Request, mockResponse as Response);
      
      expect(mockPrisma.kPIData.update).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(updatedKPI);
    });

    it('should return 400 for invalid data', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = {
        percentage: 150, // Invalid: above 100
      };
      
      await kpiController.update(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should return 500 on database error', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = {
        category: 'Updated Returns',
      };
      
      mockPrisma.kPIData.update.mockRejectedValue(new Error('Database error'));
      
      await kpiController.update(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('delete', () => {
    it('should delete a KPI', async () => {
      mockRequest.params = { id: '1' };
      mockPrisma.kPIData.delete.mockResolvedValue({});
      
      await kpiController.delete(mockRequest as Request, mockResponse as Response);
      
      expect(mockPrisma.kPIData.delete).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should return 500 on database error', async () => {
      mockRequest.params = { id: '1' };
      mockPrisma.kPIData.delete.mockRejectedValue(new Error('Database error'));
      
      await kpiController.delete(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('getByGroup', () => {
    it('should return KPIs grouped by category', async () => {
      const kpis = [
        {
          id: '1',
          category: 'Returns',
          percentage: 8.5,
          indexer: 'CDI',
          custody: 'Broker A',
          date: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          category: 'Returns',
          percentage: 12.3,
          indexer: 'IBOVESPA',
          custody: 'Broker B',
          date: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];
      
      mockRequest.query = { groupBy: 'category' };
      mockPrisma.kPIData.findMany.mockResolvedValue(kpis);
      
      await kpiController.getByGroup(mockRequest as Request, mockResponse as Response);
      
      expect(mockPrisma.kPIData.findMany).toHaveBeenCalledWith({
        orderBy: { date: 'desc' }
      });
      expect(mockResponse.json).toHaveBeenCalled();
      const response = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(response).toHaveProperty('Returns');
      expect(response['Returns']).toHaveProperty('items');
      expect(response['Returns']).toHaveProperty('totalPercentage');
      expect(response['Returns']).toHaveProperty('count');
    });

    it('should return 500 on database error', async () => {
      mockRequest.query = { groupBy: 'category' };
      mockPrisma.kPIData.findMany.mockRejectedValue(new Error('Database error'));
      
      await kpiController.getByGroup(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });
});