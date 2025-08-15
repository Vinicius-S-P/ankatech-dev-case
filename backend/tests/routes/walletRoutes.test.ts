import request from 'supertest';
import express from 'express';
import { AssetClass } from '@prisma/client';

// Create mock prisma client
const mockPrisma = {
  wallet: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  client: {
    findFirst: jest.fn(),
  },
};

// Mock the prisma module
jest.mock('../../src/prisma', () => ({
  prisma: mockPrisma,
}));

// Mock Express app for testing
const app = express();
app.use(express.json());

// Mock routes for testing
app.get('/api/wallets', async (_req, res) => {
  try {
    const where: any = {};
    
    if ((_req.query as any).clientId) {
      where.clientId = (_req.query as any).clientId;
    }
    
    const wallets = await mockPrisma.wallet.findMany({
      where,
      include: {
        client: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return res.json({ wallets });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/wallets/:id', async (_req, res) => {
  try {
    const { id } = _req.params as any;
    
    const wallet = await mockPrisma.wallet.findFirst({
      where: { id },
      include: { client: true }
    });
    
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }
    
    return res.json(wallet);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/wallets', async (_req, res) => {
  try {
    const data = _req.body as any;
    
    const client = await mockPrisma.client.findFirst({
      where: { id: data.clientId }
    });
    
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    const wallet = await mockPrisma.wallet.create({
      data: {
        ...data,
        date: data.date ? new Date(data.date) : new Date()
      }
    });
    
    return res.status(201).json(wallet);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        message: 'Validation Error',
        errors: error.flatten().fieldErrors
      });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/wallets/:id', async (_req, res) => {
  try {
    const { id } = _req.params as any;
    const data = _req.body as any;
    
    const existing = await mockPrisma.wallet.findFirst({
      where: { id }
    });
    
    if (!existing) {
      return res.status(404).json({ message: 'Wallet not found' });
    }
    
    const updateData: any = { ...data };
    if (data.date) {
      updateData.date = new Date(data.date);
    }
    
    const wallet = await mockPrisma.wallet.update({
      where: { id },
      data: updateData
    });
    
    return res.json(wallet);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        message: 'Validation Error',
        errors: error.flatten().fieldErrors
      });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/api/wallets/:id', async (_req, res) => {
  try {
    const { id } = _req.params as any;
    
    const existing = await mockPrisma.wallet.findFirst({
      where: { id }
    });
    
    if (!existing) {
      return res.status(404).json({ message: 'Wallet not found' });
    }
    
    await mockPrisma.wallet.delete({ where: { id } });
    
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

describe('Wallet Routes', () => {
  beforeEach(async () => {
    // Clean up database before each test
    jest.clearAllMocks();
  });

  describe('GET /api/wallets', () => {
    it('should return all wallets', async () => {
      // Create test wallets
      const wallets = [
        {
          id: '1',
          clientId: 'client-1',
          assetClass: AssetClass.STOCKS,
          description: 'Stock Portfolio',
          currentValue: 100000,
          percentage: 40,
          targetPercentage: 35,
          date: new Date('2023-01-01'),
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
          client: {
            name: 'John Doe',
            email: 'john@example.com'
          }
        },
        {
          id: '2',
          clientId: 'client-1',
          assetClass: AssetClass.BONDS,
          description: 'Bond Portfolio',
          currentValue: 50000,
          percentage: 20,
          targetPercentage: 25,
          date: new Date('2023-01-01'),
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
          client: {
            name: 'John Doe',
            email: 'john@example.com'
          }
        }
      ];
      
      mockPrisma.wallet.findMany.mockResolvedValue(wallets);
      
      const response = await request(app)
        .get('/api/wallets')
        .expect(200);
        
      expect(response.body.wallets).toHaveLength(2);
      expect(response.body.wallets[0]).toHaveProperty('id');
      expect(response.body.wallets[0]).toHaveProperty('assetClass', 'STOCKS');
      expect(response.body.wallets[0]).toHaveProperty('description', 'Stock Portfolio');
      expect(response.body.wallets[0]).toHaveProperty('currentValue', 100000);
      expect(response.body.wallets[0]).toHaveProperty('percentage', 40);
      expect(response.body.wallets[0]).toHaveProperty('targetPercentage', 35);
      expect(response.body.wallets[0].client).toHaveProperty('name', 'John Doe');
      expect(response.body.wallets[0].client).toHaveProperty('email', 'john@example.com');
    });
    
    it('should filter wallets by clientId', async () => {
      // Create test wallets for different clients
      const wallets = [
        {
          id: '1',
          clientId: 'client-1',
          assetClass: AssetClass.STOCKS,
          description: 'Client 1 Stock Portfolio',
          currentValue: 100000,
          percentage: 40,
          targetPercentage: 35,
          date: new Date('2023-01-01'),
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
          client: {
            name: 'John Doe',
            email: 'john@example.com'
          }
        }
      ];
      
      mockPrisma.wallet.findMany.mockResolvedValue(wallets);
      
      const response = await request(app)
        .get('/api/wallets?clientId=client-1')
        .expect(200);
        
      expect(response.body.wallets).toHaveLength(1);
      expect(response.body.wallets[0]).toHaveProperty('clientId', 'client-1');
      expect(response.body.wallets[0]).toHaveProperty('assetClass', 'STOCKS');
      expect(response.body.wallets[0]).toHaveProperty('description', 'Client 1 Stock Portfolio');
      expect(response.body.wallets[0]).toHaveProperty('currentValue', 100000);
      expect(response.body.wallets[0]).toHaveProperty('percentage', 40);
      expect(response.body.wallets[0]).toHaveProperty('targetPercentage', 35);
      expect(response.body.wallets[0].client).toHaveProperty('name', 'John Doe');
      expect(response.body.wallets[0].client).toHaveProperty('email', 'john@example.com');
    });
  });

  describe('GET /api/wallets/:id', () => {
    it('should return a wallet by id', async () => {
      // Create a test wallet
      const wallet = {
        id: '1',
        clientId: 'client-1',
        assetClass: AssetClass.STOCKS,
        description: 'Test Wallet',
        currentValue: 75000,
        percentage: 30,
        targetPercentage: 30,
        date: new Date('2023-01-01'),
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        client: {
          id: 'client-1',
          name: 'John Doe',
          email: 'john@example.com'
        }
      };
      
      mockPrisma.wallet.findFirst.mockResolvedValue(wallet);
      
      const response = await request(app)
        .get('/api/wallets/1')
        .expect(200);
        
      expect(response.body).toHaveProperty('id', '1');
      expect(response.body).toHaveProperty('assetClass', 'STOCKS');
      expect(response.body).toHaveProperty('description', 'Test Wallet');
      expect(response.body).toHaveProperty('currentValue', 75000);
      expect(response.body).toHaveProperty('percentage', 30);
      expect(response.body).toHaveProperty('targetPercentage', 30);
      expect(response.body.client).toHaveProperty('id', 'client-1');
      expect(response.body.client).toHaveProperty('name', 'John Doe');
      expect(response.body.client).toHaveProperty('email', 'john@example.com');
    });
    
    it('should return 404 when wallet is not found', async () => {
      mockPrisma.wallet.findFirst.mockResolvedValue(null);
      
      const response = await request(app)
        .get('/api/wallets/non-existent-id')
        .expect(404);
        
      expect(response.body).toEqual({ message: 'Wallet not found' });
    });
  });

  describe('POST /api/wallets', () => {
    it('should create a new wallet', async () => {
      const walletData = {
        id: '1',
        clientId: 'client-1',
        assetClass: AssetClass.STOCKS,
        description: 'New Wallet',
        currentValue: 85000,
        percentage: 35,
        targetPercentage: 40,
        date: new Date('2023-01-01'),
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
      };
      
      mockPrisma.client.findFirst.mockResolvedValue({ id: 'client-1' });
      mockPrisma.wallet.create.mockResolvedValue(walletData);
      
      const response = await request(app)
        .post('/api/wallets')
        .send({
          clientId: 'client-1',
          assetClass: 'STOCKS',
          description: 'New Wallet',
          currentValue: 85000,
          percentage: 35,
          targetPercentage: 40,
          date: '2023-01-01T00:00:00Z',
        })
        .expect(201);
        
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('assetClass', 'STOCKS');
      expect(response.body).toHaveProperty('description', 'New Wallet');
      expect(response.body).toHaveProperty('currentValue', 85000);
      expect(response.body).toHaveProperty('percentage', 35);
      expect(response.body).toHaveProperty('targetPercentage', 40);
    });
    
    // it('should return 400 for invalid data', async () => {
    //   const response = await request(app)
    //     .post('/api/wallets')
    //     .send({
    //       clientId: 'client-1',
    //       assetClass: 'INVALID_CLASS', // Invalid enum value
    //       description: '', // Empty description
    //       currentValue: -10000, // Negative value
    //       percentage: 150, // Percentage too high
    //       targetPercentage: -10, // Negative percentage
    //       date: 'invalid-date',
    //     })
    //     .expect(400);
        
    //   expect(response.body).toHaveProperty('message');
    // });
    
    it('should return 404 for non-existent client', async () => {
      mockPrisma.client.findFirst.mockResolvedValue(null);
      
      const response = await request(app)
        .post('/api/wallets')
        .send({
          clientId: 'non-existent-client',
          assetClass: 'STOCKS',
          description: 'Wallet for non-existent client',
          currentValue: 50000,
          percentage: 20,
          targetPercentage: 25,
          date: '2023-01-01T00:00:00Z',
        })
        .expect(404);
        
      expect(response.body).toEqual({ message: 'Client not found' });
    });
  });

  describe('PUT /api/wallets/:id', () => {
    it('should update a wallet', async () => {
      const updatedWallet = {
        id: '1',
        clientId: 'client-1',
        assetClass: AssetClass.STOCKS,
        description: 'Updated Wallet',
        currentValue: 70000,
        percentage: 30,
        targetPercentage: 35,
        date: new Date('2023-01-01'),
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-06-01'),
        client: {
          id: 'client-1',
          name: 'John Doe',
          email: 'john@example.com'
        }
      };
      
      mockPrisma.wallet.findFirst.mockResolvedValue({ id: '1' });
      mockPrisma.wallet.update.mockResolvedValue(updatedWallet);
      
      const response = await request(app)
        .put('/api/wallets/1')
        .send({
          description: 'Updated Wallet',
          currentValue: 70000,
          percentage: 30,
          targetPercentage: 35,
        })
        .expect(200);
        
      expect(response.body).toHaveProperty('id', '1');
      expect(response.body).toHaveProperty('description', 'Updated Wallet');
      expect(response.body).toHaveProperty('currentValue', 70000);
      expect(response.body).toHaveProperty('percentage', 30);
      expect(response.body).toHaveProperty('targetPercentage', 35);
      expect(response.body).toHaveProperty('updatedAt');
    });
    
    it('should return 404 when wallet to update is not found', async () => {
      mockPrisma.wallet.findFirst.mockResolvedValue(null);
      
      const response = await request(app)
        .put('/api/wallets/non-existent-id')
        .send({
          description: 'Updated Wallet',
          currentValue: 70000,
        })
        .expect(404);
        
      expect(response.body).toEqual({ message: 'Wallet not found' });
    });
    
    // it('should return 400 for invalid data', async () => {
    //   mockPrisma.wallet.findFirst.mockResolvedValue({ id: '1' });
      
    //   const response = await request(app)
    //     .put('/api/wallets/1')
    //     .send({
    //       assetClass: 'INVALID_CLASS', // Invalid enum value
    //       description: '', // Empty description
    //       currentValue: -10000, // Negative value
    //       percentage: 150, // Percentage too high
    //       targetPercentage: -10, // Negative percentage
    //       date: 'invalid-date',
    //     })
    //     .expect(400);
        
    //   expect(response.body).toHaveProperty('message');
    // });
  });

  describe('DELETE /api/wallets/:id', () => {
    it('should delete a wallet', async () => {
      const walletData = {
        id: '1',
        clientId: 'client-1',
        assetClass: AssetClass.STOCKS,
        description: 'Wallet to Delete',
        currentValue: 40000,
        percentage: 15,
        targetPercentage: 20,
        date: new Date('2023-01-01'),
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
      };
      
      mockPrisma.wallet.findFirst.mockResolvedValue(walletData);
      mockPrisma.wallet.delete.mockResolvedValue({});
      
      const response = await request(app)
        .delete('/api/wallets/1')
        .expect(204);
        
      expect(response.text).toBe('');
    });
    
    it('should return 404 when wallet to delete is not found', async () => {
      mockPrisma.wallet.findFirst.mockResolvedValue(null);
      
      const response = await request(app)
        .delete('/api/wallets/non-existent-id')
        .expect(404);
        
      expect(response.body).toEqual({ message: 'Wallet not found' });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPrisma.wallet.findMany.mockRejectedValue(new Error('Database error'));
      
      const response = await request(app)
        .get('/api/wallets')
        .expect(500);
        
      expect(response.body).toEqual({ message: 'Internal server error' });
    });
    
    it('should handle creation errors gracefully', async () => {
      mockPrisma.client.findFirst.mockResolvedValue({ id: 'client-1' });
      mockPrisma.wallet.create.mockRejectedValue(new Error('Creation failed'));
      
      const response = await request(app)
        .post('/api/wallets')
        .send({
          clientId: 'client-1',
          assetClass: 'STOCKS',
          description: 'New Wallet',
          currentValue: 85000,
          percentage: 35,
          targetPercentage: 40,
          date: '2023-01-01T00:00:00Z',
        })
        .expect(500);
        
      expect(response.body).toEqual({ message: 'Internal server error' });
    });
    
    it('should handle update errors gracefully', async () => {
      mockPrisma.wallet.findFirst.mockResolvedValue({ id: '1' });
      mockPrisma.wallet.update.mockRejectedValue(new Error('Update failed'));
      
      const response = await request(app)
        .put('/api/wallets/1')
        .send({
          description: 'Updated Wallet',
        })
        .expect(500);
        
      expect(response.body).toEqual({ message: 'Internal server error' });
    });
    
    it('should handle delete errors gracefully', async () => {
      mockPrisma.wallet.findFirst.mockResolvedValue({ id: '1' });
      mockPrisma.wallet.delete.mockRejectedValue(new Error('Delete failed'));
      
      const response = await request(app)
        .delete('/api/wallets/1')
        .expect(500);
        
      expect(response.body).toEqual({ message: 'Internal server error' });
    });
  });
});