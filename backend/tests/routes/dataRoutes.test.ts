import request from 'supertest';
import express from 'express';
import dataRoutes from '../../src/routes/dataRoutes';
import { dataController } from '../../src/controllers/dataController';

// Mock the data controller
jest.mock('../../src/controllers/dataController', () => ({
  dataController: {
    create: jest.fn(),
    findAll: jest.fn(),
    getSummary: jest.fn(),
    getByCategory: jest.fn(),
    getTimeline: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock validation middleware
jest.mock('../../src/middleware/validation', () => ({
  validateBody: jest.fn().mockImplementation((_schema: any) => (_req: any, _res: any, next: any) => next()),
  validateQuery: jest.fn().mockImplementation((_schema: any) => (_req: any, _res: any, next: any) => next()),
  validateParams: jest.fn().mockImplementation((_schema: any) => (_req: any, _res: any, next: any) => next()),
}));

// Create express app for testing
const app = express();
app.use(express.json());
app.use('/api/data', dataRoutes);

describe('Data Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/data', () => {
    it('should create new data entry', async () => {
      const dataEntry = {
        id: '1',
        clientId: 'client-1',
        category: 'Investment',
        description: 'Stock purchase',
        value: 10000,
        date: new Date().toISOString(),
      };

      (dataController.create as jest.Mock).mockImplementation((_req, res) => {
        res.status(201).json(dataEntry);
      });

      const response = await request(app)
        .post('/api/data')
        .send({
          clientId: 'client-1',
          category: 'Investment',
          description: 'Stock purchase',
          value: 10000,
          date: new Date().toISOString(),
        })
        .expect(201);

      expect(response.body).toEqual(dataEntry);
      expect(dataController.create).toHaveBeenCalled();
    });
  });

  describe('GET /api/data', () => {
    it('should get all data entries', async () => {
      const dataEntries = [
        {
          id: '1',
          clientId: 'client-1',
          category: 'Investment',
          description: 'Stock purchase',
          value: 10000,
          date: new Date().toISOString(),
        }
      ];

      (dataController.findAll as jest.Mock).mockImplementation((_req, res) => {
        res.json({ data: dataEntries, pagination: { page: 1, limit: 10, total: 1 } });
      });

      const response = await request(app)
        .get('/api/data')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(dataController.findAll).toHaveBeenCalled();
    });

    it('should get data entries with query parameters', async () => {
      (dataController.findAll as jest.Mock).mockImplementation((_req, res) => {
        res.json({ data: [], pagination: { page: 1, limit: 10, total: 0 } });
      });

      await request(app)
        .get('/api/data?clientId=client-1&category=Investment')
        .expect(200);

      expect(dataController.findAll).toHaveBeenCalled();
    });
  });

  describe('GET /api/data/summary', () => {
    it('should get data summary', async () => {
      const summary = {
        totalValue: 100000,
        count: 10,
        byCategory: {
          Investment: 60000,
          Savings: 40000,
        }
      };

      (dataController.getSummary as jest.Mock).mockImplementation((_req, res) => {
        res.json(summary);
      });

      const response = await request(app)
        .get('/api/data/summary')
        .expect(200);

      expect(response.body).toEqual(summary);
      expect(dataController.getSummary).toHaveBeenCalled();
    });
  });

  describe('GET /api/data/by-category', () => {
    it('should get data grouped by category', async () => {
      const groupedData = {
        Investment: [
          { id: '1', value: 10000, description: 'Stock purchase' }
        ],
        Savings: [
          { id: '2', value: 5000, description: 'Savings deposit' }
        ]
      };

      (dataController.getByCategory as jest.Mock).mockImplementation((_req, res) => {
        res.json(groupedData);
      });

      const response = await request(app)
        .get('/api/data/by-category')
        .expect(200);

      expect(response.body).toEqual(groupedData);
      expect(dataController.getByCategory).toHaveBeenCalled();
    });
  });

  describe('GET /api/data/timeline', () => {
    it('should get data timeline', async () => {
      const timeline = [
        { date: '2023-01', total: 10000 },
        { date: '2023-02', total: 15000 },
      ];

      (dataController.getTimeline as jest.Mock).mockImplementation((_req, res) => {
        res.json(timeline);
      });

      const response = await request(app)
        .get('/api/data/timeline')
        .expect(200);

      expect(response.body).toEqual(timeline);
      expect(dataController.getTimeline).toHaveBeenCalled();
    });
  });

  describe('GET /api/data/:id', () => {
    it('should get data entry by id', async () => {
      const dataEntry = {
        id: '1',
        clientId: 'client-1',
        category: 'Investment',
        description: 'Stock purchase',
        value: 10000,
        date: new Date().toISOString(),
      };

      (dataController.findById as jest.Mock).mockImplementation((_req, res) => {
        res.json(dataEntry);
      });

      const response = await request(app)
        .get('/api/data/1')
        .expect(200);

      expect(response.body).toEqual(dataEntry);
      expect(dataController.findById).toHaveBeenCalled();
    });

    it('should return 404 for non-existent data entry', async () => {
      (dataController.findById as jest.Mock).mockImplementation((_req, res) => {
        res.status(404).json({ message: 'Data entry not found' });
      });

      await request(app)
        .get('/api/data/non-existent')
        .expect(404);
    });
  });

  describe('PUT /api/data/:id', () => {
    it('should update data entry', async () => {
      const updatedDataEntry = {
        id: '1',
        clientId: 'client-1',
        category: 'Investment',
        description: 'Updated stock purchase',
        value: 12000,
        date: new Date().toISOString(),
      };

      (dataController.update as jest.Mock).mockImplementation((_req, res) => {
        res.json(updatedDataEntry);
      });

      const response = await request(app)
        .put('/api/data/1')
        .send({
          description: 'Updated stock purchase',
          value: 12000,
        })
        .expect(200);

      expect(response.body).toEqual(updatedDataEntry);
      expect(dataController.update).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/data/:id', () => {
    it('should delete data entry', async () => {
      (dataController.delete as jest.Mock).mockImplementation((_req, res) => {
        res.status(204).send();
      });

      await request(app)
        .delete('/api/data/1')
        .expect(204);

      expect(dataController.delete).toHaveBeenCalled();
    });
  });
});