import request from 'supertest';
import express from 'express';
import kpiRoutes from '../../src/routes/kpiRoutes';
import { kpiController } from '../../src/controllers/kpiController';

jest.mock('../../src/controllers/kpiController', () => ({
  kpiController: {
    create: jest.fn(),
    findAll: jest.fn(),
    getByGroup: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

// Create express app for testing
const app = express();
app.use(express.json());
app.use('/api/kpis', kpiRoutes);

describe('KPI Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/kpis', () => {
    it('should create a new KPI', async () => {
      const kpiData = {
        id: '1',
        category: 'Returns',
        percentage: 8.5,
        indexer: 'CDI',
        custody: 'Broker A',
      };

      (kpiController.create as jest.Mock).mockImplementation((_req, res) => {
        res.status(201).json(kpiData);
      });

      const response = await request(app)
        .post('/api/kpis')
        .send({
          category: 'Returns',
          percentage: 8.5,
          indexer: 'CDI',
          custody: 'Broker A',
        })
        .expect(201);

      expect(response.body).toEqual(kpiData);
      expect(kpiController.create).toHaveBeenCalled();
    });
  });

  describe('GET /api/kpis', () => {
    it('should get all KPIs', async () => {
      const kpis = [
        {
          id: '1',
          category: 'Returns',
          percentage: 8.5,
          indexer: 'CDI',
          custody: 'Broker A',
        }
      ];

      (kpiController.findAll as jest.Mock).mockImplementation((_req, res) => {
        res.json({ kpis, summary: {} });
      });

      const response = await request(app)
        .get('/api/kpis')
        .expect(200);

      expect(response.body).toHaveProperty('kpis');
      expect(response.body).toHaveProperty('summary');
      expect(kpiController.findAll).toHaveBeenCalled();
    });

    it('should get KPIs with query parameters', async () => {
      (kpiController.findAll as jest.Mock).mockImplementation((_req, res) => {
        res.json({ kpis: [], summary: {} });
      });

      await request(app)
        .get('/api/kpis?category=Returns&indexer=CDI')
        .expect(200);

      expect(kpiController.findAll).toHaveBeenCalled();
    });
  });

  describe('GET /api/kpis/grouped', () => {
    it('should get KPIs grouped by category', async () => {
      const groupedData = {
        Returns: {
          items: [],
          totalPercentage: 0,
          count: 0
        }
      };

      (kpiController.getByGroup as jest.Mock).mockImplementation((_req, res) => {
        res.json(groupedData);
      });

      const response = await request(app)
        .get('/api/kpis/grouped')
        .expect(200);

      expect(response.body).toEqual(groupedData);
      expect(kpiController.getByGroup).toHaveBeenCalled();
    });

    it('should get KPIs grouped by indexer', async () => {
      (kpiController.getByGroup as jest.Mock).mockImplementation((_req, res) => {
        res.json({});
      });

      await request(app)
        .get('/api/kpis/grouped?groupBy=indexer')
        .expect(200);

      expect(kpiController.getByGroup).toHaveBeenCalled();
    });
  });

  describe('GET /api/kpis/:id', () => {
    it('should get a KPI by id', async () => {
      const kpiData = {
        id: '1',
        category: 'Returns',
        percentage: 8.5,
        indexer: 'CDI',
        custody: 'Broker A',
      };

      (kpiController.findById as jest.Mock).mockImplementation((_req, res) => {
        res.json(kpiData);
      });

      const response = await request(app)
        .get('/api/kpis/1')
        .expect(200);

      expect(response.body).toEqual(kpiData);
      expect(kpiController.findById).toHaveBeenCalled();
    });

    it('should return 404 for non-existent KPI', async () => {
      (kpiController.findById as jest.Mock).mockImplementation((_req, res) => {
        res.status(404).json({ message: 'KPI not found' });
      });

      await request(app)
        .get('/api/kpis/non-existent')
        .expect(404);
    });
  });

  describe('PUT /api/kpis/:id', () => {
    it('should update a KPI', async () => {
      const updatedKPI = {
        id: '1',
        category: 'Updated Returns',
        percentage: 9.2,
        indexer: 'CDI',
        custody: 'Broker A',
      };

      (kpiController.update as jest.Mock).mockImplementation((_req, res) => {
        res.json(updatedKPI);
      });

      const response = await request(app)
        .put('/api/kpis/1')
        .send({
          category: 'Updated Returns',
          percentage: 9.2,
        })
        .expect(200);

      expect(response.body).toEqual(updatedKPI);
      expect(kpiController.update).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/kpis/:id', () => {
    it('should delete a KPI', async () => {
      (kpiController.delete as jest.Mock).mockImplementation((_req, res) => {
        res.status(204).send();
      });

      await request(app)
        .delete('/api/kpis/1')
        .expect(204);

      expect(kpiController.delete).toHaveBeenCalled();
    });
  });
});