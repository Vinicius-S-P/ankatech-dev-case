import { Request, Response, NextFunction } from 'express';
import { DataController } from '../../src/controllers/dataController';

jest.mock('@prisma/client', () => {
  const mockPrismaData = {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };
  
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      data: mockPrismaData,
    })),
    mockPrismaData,
  };
});

describe('DataController', () => {
  let dataController: DataController;
  let mockPrisma: any;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    dataController = new DataController();
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
    
    mockNext = jest.fn();
    
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new data entry', async () => {
      const mockData = {
        label: 'Test Label',
        value: 100,
        category: 'plano_original',
        date: '2024-01-01',
      };
      
      const mockCreatedData = {
        id: '1',
        ...mockData,
        date: new Date(mockData.date),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.body = mockData;
      mockPrisma.data.create.mockResolvedValue(mockCreatedData);

      await dataController.create(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPrisma.data.create).toHaveBeenCalledWith({
        data: {
          label: mockData.label,
          value: mockData.value,
          category: mockData.category,
          date: new Date(mockData.date),
        },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockCreatedData);
    });

    it('should handle errors during creation', async () => {
      const error = new Error('Database error');
      mockRequest.body = { label: 'Test' };
      mockPrisma.data.create.mockRejectedValue(error);

      await dataController.create(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('findAll', () => {
    it('should return paginated data', async () => {
      const mockData = [
        { id: '1', label: 'Test 1', value: 100 },
        { id: '2', label: 'Test 2', value: 200 },
      ];
      
      mockRequest.query = { page: '1', limit: '10' };
      mockPrisma.data.findMany.mockResolvedValue(mockData);
      mockPrisma.data.count.mockResolvedValue(2);

      await dataController.findAll(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPrisma.data.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { date: 'desc' },
      });
      
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: mockData,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should apply filters correctly', async () => {
      mockRequest.query = {
        category: 'plano_original',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        page: '1',
        limit: '10',
      };

      mockPrisma.data.findMany.mockResolvedValue([]);
      mockPrisma.data.count.mockResolvedValue(0);

      await dataController.findAll(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPrisma.data.findMany).toHaveBeenCalledWith({
        where: {
          category: 'plano_original',
          date: {
            gte: new Date('2024-01-01'),
            lte: new Date('2024-12-31'),
          },
        },
        skip: 0,
        take: 10,
        orderBy: { date: 'desc' },
      });
    });
  });

  describe('findById', () => {
    it('should return data by id', async () => {
      const mockData = { id: '1', label: 'Test', value: 100 };
      mockRequest.params = { id: '1' };
      mockPrisma.data.findUnique.mockResolvedValue(mockData);

      await dataController.findById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPrisma.data.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(mockResponse.json).toHaveBeenCalledWith(mockData);
    });

    it('should return 404 when data not found', async () => {
      mockRequest.params = { id: 'nonexistent' };
      mockPrisma.data.findUnique.mockResolvedValue(null);

      await dataController.findById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Data not found',
          statusCode: 404,
        })
      );
    });
  });

  describe('update', () => {
    it('should update data successfully', async () => {
      const updateData = { label: 'Updated Label', value: 150 };
      const updatedData = { id: '1', ...updateData };
      
      mockRequest.params = { id: '1' };
      mockRequest.body = updateData;
      mockPrisma.data.update.mockResolvedValue(updatedData);

      await dataController.update(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPrisma.data.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          label: updateData.label,
          value: updateData.value,
        },
      });
      expect(mockResponse.json).toHaveBeenCalledWith(updatedData);
    });
  });

  describe('delete', () => {
    it('should delete data successfully', async () => {
      mockRequest.params = { id: '1' };
      mockPrisma.data.delete.mockResolvedValue({ id: '1' });

      await dataController.delete(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPrisma.data.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalled();
    });
  });

  describe('getSummary', () => {
    it('should return summary data for all categories', async () => {
      const mockCategoryData = [
        { value: 100 },
        { value: 200 },
        { value: 150 },
      ];

      mockPrisma.data.findMany.mockResolvedValueOnce(mockCategoryData);
      mockPrisma.data.findMany.mockResolvedValueOnce([]);
      mockPrisma.data.findMany.mockResolvedValueOnce([]);

      await dataController.getSummary(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPrisma.data.findMany).toHaveBeenCalledTimes(3);
      expect(mockResponse.json).toHaveBeenCalledWith([
        {
          category: 'plano_original',
          total: 450,
          average: 150,
          min: 100,
          max: 200,
          count: 3,
        },
        {
          category: 'situacao_atual',
          total: 0,
          average: 0,
          min: 0,
          max: 0,
          count: 0,
        },
        {
          category: 'custo_vida',
          total: 0,
          average: 0,
          min: 0,
          max: 0,
          count: 0,
        },
      ]);
    });
  });

  describe('getTimeline', () => {
    it('should return timeline data grouped by date', async () => {
      const mockData = [
        {
          id: '1',
          label: 'Test 1',
          value: 100,
          category: 'plano_original',
          date: new Date('2024-01-01'),
        },
        {
          id: '2',
          label: 'Test 2',
          value: 200,
          category: 'situacao_atual',
          date: new Date('2024-01-01'),
        },
        {
          id: '3',
          label: 'Test 3',
          value: 150,
          category: 'plano_original',
          date: new Date('2024-01-02'),
        },
      ];

      mockPrisma.data.findMany.mockResolvedValue(mockData);

      await dataController.getTimeline(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPrisma.data.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { date: 'asc' },
        select: {
          id: true,
          label: true,
          value: true,
          category: true,
          date: true,
        },
      });

      expect(mockResponse.json).toHaveBeenCalledWith([
        {
          date: '2024-01-01',
          plano_original: 100,
          situacao_atual: 200,
          custo_vida: 0,
        },
        {
          date: '2024-01-02',
          plano_original: 150,
          situacao_atual: 0,
          custo_vida: 0,
        },
      ]);
    });
  });
});
