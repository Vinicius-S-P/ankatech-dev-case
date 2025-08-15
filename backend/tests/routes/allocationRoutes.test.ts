import request from 'supertest';
import express from 'express';
import allocationRoutes from '../../src/routes/allocationRoutes';
import { allocationController } from '../../src/controllers/allocationController';

jest.mock('../../src/controllers/allocationController', () => ({
  allocationController: {
    create: jest.fn(),
    getCurrent: jest.fn(),
    getHistory: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

const app = express();
app.use(express.json());
app.use('/api/allocations', allocationRoutes);

describe('Allocation Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/allocations', () => {
    it('should create a new allocation', async () => {
      const allocationData = {
        id: '1',
        totalAllocated: 100000,
        emergencyExpected: 10000,
        emergencyActual: 9500,
        date: new Date().toISOString(),
      };

      (allocationController.create as jest.Mock).mockImplementation((_req, res) => {
        res.status(201).json(allocationData);
      });

      const response = await request(app)
        .post('/api/allocations')
        .send({
          totalAllocated: 100000,
          emergencyExpected: 10000,
          emergencyActual: 9500,
        })
        .expect(201);

      expect(response.body).toEqual(allocationData);
      expect(allocationController.create).toHaveBeenCalled();
    });
  });

  describe('GET /api/allocations/current', () => {
    it('should get current allocation', async () => {
      const allocationData = {
        id: '1',
        totalAllocated: 100000,
        emergencyExpected: 10000,
        emergencyActual: 9500,
        date: new Date().toISOString(),
      };

      (allocationController.getCurrent as jest.Mock).mockImplementation((_req, res) => {
        res.json(allocationData);
      });

      const response = await request(app)
        .get('/api/allocations/current')
        .expect(200);

      expect(response.body).toEqual(allocationData);
      expect(allocationController.getCurrent).toHaveBeenCalled();
    });
  });

  describe('GET /api/allocations/history', () => {
    it('should get allocation history', async () => {
      const allocations = [
        {
          id: '1',
          totalAllocated: 100000,
          emergencyExpected: 10000,
          emergencyActual: 9500,
          date: new Date().toISOString(),
        },
        {
          id: '2',
          totalAllocated: 110000,
          emergencyExpected: 11000,
          emergencyActual: 10500,
          date: new Date().toISOString(),
        }
      ];

      (allocationController.getHistory as jest.Mock).mockImplementation((_req, res) => {
        res.json(allocations);
      });

      const response = await request(app)
        .get('/api/allocations/history')
        .expect(200);

      expect(response.body).toEqual(allocations);
      expect(allocationController.getHistory).toHaveBeenCalled();
    });

    it('should get allocation history with query parameters', async () => {
      const allocations: any[] = [];

      (allocationController.getHistory as jest.Mock).mockImplementation((_req, res) => {
        res.json(allocations);
      });

      const startDate = '2023-01-01T00:00:00Z';
      const endDate = '2023-12-31T23:59:59Z';

      await request(app)
        .get(`/api/allocations/history?startDate=${startDate}&endDate=${endDate}`)
        .expect(200);

      expect(allocationController.getHistory).toHaveBeenCalled();
    });
  });

  describe('PUT /api/allocations/:id', () => {
    it('should update an allocation', async () => {
      const updatedAllocation = {
        id: '1',
        totalAllocated: 120000,
        emergencyExpected: 12000,
        emergencyActual: 11500,
        date: new Date().toISOString(),
      };

      (allocationController.update as jest.Mock).mockImplementation((_req, res) => {
        res.json(updatedAllocation);
      });

      const response = await request(app)
        .put('/api/allocations/1')
        .send({
          totalAllocated: 120000,
          emergencyExpected: 12000,
        })
        .expect(200);

      expect(response.body).toEqual(updatedAllocation);
      expect(allocationController.update).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/allocations/:id', () => {
    it('should delete an allocation', async () => {
      (allocationController.delete as jest.Mock).mockImplementation((_req, res) => {
        res.status(204).send();
      });

      await request(app)
        .delete('/api/allocations/1')
        .expect(204);

      expect(allocationController.delete).toHaveBeenCalled();
    });
  });
});