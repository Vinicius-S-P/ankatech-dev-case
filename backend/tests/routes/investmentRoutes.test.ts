import request from 'supertest';
import express from 'express';
import investmentRoutes from '../../src/routes/investmentRoutes';
import { investmentController } from '../../src/controllers/investmentController';

jest.mock('../../src/controllers/investmentController', () => ({
  investmentController: {
    create: jest.fn(),
    findAll: jest.fn(),
    getByAssetType: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

// Create express app for testing
const app = express();
app.use(express.json());
app.use('/api/investments', investmentRoutes);

describe('Investment Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/investments', () => {
    it('should create a new investment', async () => {
      const investmentData = {
        id: '1',
        name: 'Apple Stocks',
        type: 'STOCKS',
        assetType: 'EQUITY',
        currentValue: 10000,
        initialValue: 8000,
        percentChange: 25,
        allocation: 10,
      };

      (investmentController.create as jest.Mock).mockImplementation((_req, res) => {
        res.status(201).json(investmentData);
      });

      const response = await request(app)
        .post('/api/investments')
        .send({
          name: 'Apple Stocks',
          type: 'STOCKS',
          assetType: 'EQUITY',
          currentValue: 10000,
          initialValue: 8000,
          percentChange: 25,
          allocation: 10,
        })
        .expect(201);

      expect(response.body).toEqual(investmentData);
      expect(investmentController.create).toHaveBeenCalled();
    });
  });

  describe('GET /api/investments', () => {
    it('should get all investments', async () => {
      const investments = [
        {
          id: '1',
          name: 'Apple Stocks',
          type: 'STOCKS',
          assetType: 'EQUITY',
          currentValue: 10000,
          initialValue: 8000,
          percentChange: 25,
          allocation: 10,
        }
      ];

      (investmentController.findAll as jest.Mock).mockImplementation((_req, res) => {
        res.json({ investments, summary: {} });
      });

      const response = await request(app)
        .get('/api/investments')
        .expect(200);

      expect(response.body).toHaveProperty('investments');
      expect(response.body).toHaveProperty('summary');
      expect(investmentController.findAll).toHaveBeenCalled();
    });

    it('should get investments with query parameters', async () => {
      (investmentController.findAll as jest.Mock).mockImplementation((_req, res) => {
        res.json({ investments: [], summary: {} });
      });

      await request(app)
        .get('/api/investments?assetType=EQUITY&type=STOCKS')
        .expect(200);

      expect(investmentController.findAll).toHaveBeenCalled();
    });
  });

  describe('GET /api/investments/by-asset-type', () => {
    it('should get investments grouped by asset type', async () => {
      const groupedData = {
        financial: [],
        realEstate: [],
        total: { financial: 0, realEstate: 0, total: 0 }
      };

      (investmentController.getByAssetType as jest.Mock).mockImplementation((_req, res) => {
        res.json(groupedData);
      });

      const response = await request(app)
        .get('/api/investments/by-asset-type')
        .expect(200);

      expect(response.body).toEqual(groupedData);
      expect(investmentController.getByAssetType).toHaveBeenCalled();
    });
  });

  describe('GET /api/investments/:id', () => {
    it('should get an investment by id', async () => {
      const investmentData = {
        id: '1',
        name: 'Apple Stocks',
        type: 'STOCKS',
        assetType: 'EQUITY',
        currentValue: 10000,
        initialValue: 8000,
        percentChange: 25,
        allocation: 10,
      };

      (investmentController.findById as jest.Mock).mockImplementation((_req, res) => {
        res.json(investmentData);
      });

      const response = await request(app)
        .get('/api/investments/1')
        .expect(200);

      expect(response.body).toEqual(investmentData);
      expect(investmentController.findById).toHaveBeenCalled();
    });

    it('should return 404 for non-existent investment', async () => {
      (investmentController.findById as jest.Mock).mockImplementation((_req, res) => {
        res.status(404).json({ message: 'Investment not found' });
      });

      await request(app)
        .get('/api/investments/non-existent')
        .expect(404);
    });
  });

  describe('PUT /api/investments/:id', () => {
    it('should update an investment', async () => {
      const updatedInvestment = {
        id: '1',
        name: 'Updated Apple Stocks',
        type: 'STOCKS',
        assetType: 'EQUITY',
        currentValue: 12000,
        initialValue: 8000,
        percentChange: 50,
        allocation: 12,
      };

      (investmentController.update as jest.Mock).mockImplementation((_req, res) => {
        res.json(updatedInvestment);
      });

      const response = await request(app)
        .put('/api/investments/1')
        .send({
          name: 'Updated Apple Stocks',
          currentValue: 12000,
          percentChange: 50,
        })
        .expect(200);

      expect(response.body).toEqual(updatedInvestment);
      expect(investmentController.update).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/investments/:id', () => {
    it('should delete an investment', async () => {
      (investmentController.delete as jest.Mock).mockImplementation((_req, res) => {
        res.status(204).send();
      });

      await request(app)
        .delete('/api/investments/1')
        .expect(204);

      expect(investmentController.delete).toHaveBeenCalled();
    });
  });
});