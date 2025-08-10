import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';

const app = express();
const PORT = process.env.PORT || 4000;
const prisma = new PrismaClient();

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(morgan('dev'));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Simple test routes
app.get('/api/test', (_req, res) => {
  res.json({ message: 'API is working' });
});

// Get all investments
app.get('/api/investments', async (_req, res) => {
  try {
    const investments = await prisma.investment.findMany();
    res.json({ investments });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch investments' });
  }
});

// Get investments by asset type
app.get('/api/investments/by-asset-type', async (_req, res) => {
  try {
    const investments = await prisma.investment.findMany({
      orderBy: { date: 'desc' }
    });

    const financial = investments
      .filter((inv) => inv.assetType === 'FINANCEIRA')
      .map((inv) => ({
        ...inv,
        icon: inv.type
      }));

    const realEstate = investments
      .filter((inv) => inv.assetType === 'IMOBILIZADA')
      .map((inv) => ({
        ...inv,
        icon: inv.type
      }));

    const total = {
      financial: financial.reduce((sum: number, inv) => sum + inv.currentValue, 0),
      realEstate: realEstate.reduce((sum: number, inv) => sum + inv.currentValue, 0),
      total: investments.reduce((sum: number, inv) => sum + inv.currentValue, 0)
    };

    res.json({ financial, realEstate, total });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch investments by asset type' });
  }
});

// Get all allocations
app.get('/api/allocations/current', async (_req, res) => {
  try {
    const allocation = await prisma.allocation.findFirst({
      orderBy: { date: 'desc' }
    });
    res.json(allocation || {});
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch allocation' });
  }
});

// Get current goal
app.get('/api/goals/current', async (_req, res) => {
  try {
    const goal = await prisma.goal.findFirst({
      orderBy: { date: 'desc' }
    });
    res.json(goal || {});
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch goal' });
  }
});

// Get all KPIs
app.get('/api/kpis', async (_req, res) => {
  try {
    const kpis = await prisma.kPIData.findMany();
    res.json({ kpis });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch KPIs' });
  }
});

// Get all data items
app.get('/api/data', async (_req, res) => {
  try {
    const data = await prisma.data.findMany();
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// Clients API
app.get('/api/clients', async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    
    const where = search 
      ? {
          OR: [
            { name: { contains: search as string, mode: 'insensitive' as const } },
            { email: { contains: search as string, mode: 'insensitive' as const } }
          ]
        }
      : {};

    const clients = await prisma.client.findMany({
      where,
      take: Number(limit),
      skip: (Number(page) - 1) * Number(limit),
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.client.count({ where });

    res.json({
      clients,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

app.post('/api/clients', async (req, res) => {
  try {
    const client = await prisma.client.create({
      data: req.body
    });
    res.status(201).json(client);
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ error: 'Failed to create client' });
  }
});

app.get('/api/clients/:id', async (req, res) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id }
    });
    
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    res.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ error: 'Failed to fetch client' });
  }
});

app.put('/api/clients/:id', async (req, res) => {
  try {
    const client = await prisma.client.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(client);
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ error: 'Failed to update client' });
  }
});

app.delete('/api/clients/:id', async (req, res) => {
  try {
    await prisma.client.delete({
      where: { id: req.params.id }
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

// Goals API
app.get('/api/goals', async (req, res) => {
  try {
    const { clientId } = req.query;
    
    const where = clientId ? { clientId: clientId as string } : {};
    
    const goals = await prisma.goal.findMany({
      where,
      orderBy: { targetDate: 'asc' },
      include: {
        client: {
          select: { name: true }
        }
      }
    });

    res.json({
      data: goals,
      total: goals.length
    });
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

app.post('/api/goals', async (req, res) => {
  try {
    const goal = await prisma.goal.create({
      data: req.body
    });
    res.status(201).json(goal);
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

app.put('/api/goals/:id', async (req, res) => {
  try {
    const goal = await prisma.goal.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(goal);
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

app.get('/api/goals/:id', async (req, res) => {
  try {
    const goal = await prisma.goal.findUnique({
      where: { id: req.params.id },
      include: {
        client: {
          select: { name: true }
        }
      }
    });
    
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    res.json(goal);
  } catch (error) {
    console.error('Error fetching goal:', error);
    res.status(500).json({ error: 'Failed to fetch goal' });
  }
});

app.delete('/api/goals/:id', async (req, res) => {
  try {
    await prisma.goal.delete({
      where: { id: req.params.id }
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

// Wallets API
app.get('/api/wallets', async (req, res) => {
  try {
    const { clientId } = req.query;
    
    const where = clientId ? { clientId: clientId as string } : {};
    
    const wallets = await prisma.wallet.findMany({
      where,
      orderBy: { percentage: 'desc' },
      include: {
        client: {
          select: { name: true }
        }
      }
    });

    res.json({
      data: wallets,
      total: wallets.length
    });
  } catch (error) {
    console.error('Error fetching wallets:', error);
    res.status(500).json({ error: 'Failed to fetch wallets' });
  }
});

app.get('/api/wallets/:id', async (req, res) => {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { id: req.params.id },
      include: {
        client: {
          select: { name: true }
        }
      }
    });
    
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }
    
    res.json(wallet);
  } catch (error) {
    console.error('Error fetching wallet:', error);
    res.status(500).json({ error: 'Failed to fetch wallet' });
  }
});

app.post('/api/wallets', async (req, res) => {
  try {
    console.log('📦 POST /api/wallets - Received data:', JSON.stringify(req.body, null, 2));
    
    // Validate required fields
    const { clientId, assetClass, currentValue, percentage } = req.body;
    
    if (!clientId) {
      console.error('❌ Missing clientId');
      return res.status(400).json({ error: 'clientId is required' });
    }
    
    if (!assetClass) {
      console.error('❌ Missing assetClass');
      return res.status(400).json({ error: 'assetClass is required' });
    }
    
    if (currentValue === undefined || currentValue === null) {
      console.error('❌ Missing currentValue');
      return res.status(400).json({ error: 'currentValue is required' });
    }
    
    if (percentage === undefined || percentage === null) {
      console.error('❌ Missing percentage');
      return res.status(400).json({ error: 'percentage is required' });
    }
    
    // Verify client exists
    const clientExists = await prisma.client.findUnique({
      where: { id: clientId }
    });
    
    if (!clientExists) {
      console.error('❌ Client not found:', clientId);
      return res.status(400).json({ error: 'Client not found' });
    }
    
    console.log('✅ All validations passed, creating wallet...');
    
    // Remove campos que não existem no schema do Prisma
    const { targetPercentage, ...validData } = req.body;
    
    const wallet = await prisma.wallet.create({
      data: {
        clientId,
        assetClass,
        description: req.body.description || null,
        currentValue: parseFloat(currentValue),
        percentage: parseFloat(percentage)
      }
    });
    
    console.log('✅ Wallet created successfully:', wallet.id);
    res.status(201).json(wallet);
  } catch (error) {
    console.error('❌ Error creating wallet:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
    res.status(500).json({ error: 'Failed to create wallet', details: error.message });
  }
});

app.put('/api/wallets/:id', async (req, res) => {
  try {
    const wallet = await prisma.wallet.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(wallet);
  } catch (error) {
    console.error('Error updating wallet:', error);
    res.status(500).json({ error: 'Failed to update wallet' });
  }
});

app.delete('/api/wallets/:id', async (req, res) => {
  try {
    await prisma.wallet.delete({
      where: { id: req.params.id }
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting wallet:', error);
    res.status(500).json({ error: 'Failed to delete wallet' });
  }
});

// Events API
app.get('/api/events', async (req, res) => {
  try {
    const { clientId } = req.query;
    
    const where = clientId ? { clientId: clientId as string } : {};
    
    const events = await prisma.event.findMany({
      where,
      orderBy: { startDate: 'desc' },
      include: {
        client: {
          select: { name: true }
        }
      }
    });

    res.json({
      data: events,
      total: events.length
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

app.get('/api/events/:id', async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: {
        client: {
          select: { name: true }
        }
      }
    });
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

app.post('/api/events', async (req, res) => {
  try {
    const event = await prisma.event.create({
      data: req.body
    });
    res.status(201).json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

app.put('/api/events/:id', async (req, res) => {
  try {
    const event = await prisma.event.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(event);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

app.delete('/api/events/:id', async (req, res) => {
  try {
    await prisma.event.delete({
      where: { id: req.params.id }
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// Insurance API
app.get('/api/insurance', async (req, res) => {
  try {
    const { clientId } = req.query;
    
    const where = clientId ? { clientId: clientId as string } : {};
    
    const insurance = await prisma.insurance.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: { name: true }
        }
      }
    });

    res.json({
      data: insurance,
      total: insurance.length
    });
  } catch (error) {
    console.error('Error fetching insurance:', error);
    res.status(500).json({ error: 'Failed to fetch insurance' });
  }
});

app.get('/api/insurance/:id', async (req, res) => {
  try {
    const insurance = await prisma.insurance.findUnique({
      where: { id: req.params.id },
      include: {
        client: {
          select: { name: true }
        }
      }
    });
    
    if (!insurance) {
      return res.status(404).json({ error: 'Insurance not found' });
    }
    
    res.json(insurance);
  } catch (error) {
    console.error('Error fetching insurance:', error);
    res.status(500).json({ error: 'Failed to fetch insurance' });
  }
});

app.post('/api/insurance', async (req, res) => {
  try {
    const insurance = await prisma.insurance.create({
      data: req.body
    });
    res.status(201).json(insurance);
  } catch (error) {
    console.error('Error creating insurance:', error);
    res.status(500).json({ error: 'Failed to create insurance' });
  }
});

app.put('/api/insurance/:id', async (req, res) => {
  try {
    const insurance = await prisma.insurance.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(insurance);
  } catch (error) {
    console.error('Error updating insurance:', error);
    res.status(500).json({ error: 'Failed to update insurance' });
  }
});

app.delete('/api/insurance/:id', async (req, res) => {
  try {
    await prisma.insurance.delete({
      where: { id: req.params.id }
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting insurance:', error);
    res.status(500).json({ error: 'Failed to delete insurance' });
  }
});

// Auth API (Simple implementation - sem JWT real)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Simulação básica de login
    if (email && password) {
      res.json({
        token: 'mock-jwt-token',
        user: {
          id: '1',
          email,
          name: 'User Test',
          role: 'ADVISOR'
        }
      });
    } else {
      res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const userData = req.body;
    
    // Simulação de registro
    res.status(201).json({
      id: 'new-user-id',
      email: userData.email,
      name: userData.name
    });
  } catch (error) {
    console.error('Error in register:', error);
    res.status(500).json({ error: 'Failed to register' });
  }
});

app.get('/api/auth/verify', async (req, res) => {
  try {
    // Simulação de verificação
    res.json({
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'User Test',
        role: 'ADVISOR'
      }
    });
  } catch (error) {
    console.error('Error in verify:', error);
    res.status(500).json({ error: 'Failed to verify' });
  }
});

// Client extras
app.get('/api/clients/:id/alignment', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Simulação de cálculo de alinhamento
    res.json({
      currentWealth: 150000,
      plannedWealth: 200000,
      alignmentPercentage: 75,
      category: 'Parcialmente Alinhado',
      color: 'yellow-light',
      suggestions: [
        {
          type: 'INCREASE_CONTRIBUTION',
          message: 'Aumente contribuição em R$ 2.083,33 por 24 meses',
          impact: 'Alinhamento aumentará para 90%'
        }
      ]
    });
  } catch (error) {
    console.error('Error fetching alignment:', error);
    res.status(500).json({ error: 'Failed to fetch alignment' });
  }
});

app.get('/api/clients/:id/suggestions', async (req, res) => {
  try {
    res.json({
      suggestions: [
        { type: 'DIVERSIFICATION', message: 'Diversificar carteira', priority: 'high' },
        { type: 'REBALANCING', message: 'Rebalancear portfólio', priority: 'medium' }
      ]
    });
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

// Simulations API
app.get('/api/simulations', async (req, res) => {
  try {
    const { clientId } = req.query;
    
    const where = clientId ? { clientId: clientId as string } : {};
    
    const simulations = await prisma.simulation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: { name: true }
        }
      }
    });

    res.json({
      data: simulations,
      total: simulations.length
    });
  } catch (error) {
    console.error('Error fetching simulations:', error);
    res.status(500).json({ error: 'Failed to fetch simulations' });
  }
});

app.get('/api/simulations/:id', async (req, res) => {
  try {
    const simulation = await prisma.simulation.findUnique({
      where: { id: req.params.id },
      include: {
        client: {
          select: { name: true }
        }
      }
    });
    
    if (!simulation) {
      return res.status(404).json({ error: 'Simulation not found' });
    }
    
    res.json(simulation);
  } catch (error) {
    console.error('Error fetching simulation:', error);
    res.status(500).json({ error: 'Failed to fetch simulation' });
  }
});

app.post('/api/simulations', async (req, res) => {
  try {
    const simulation = await prisma.simulation.create({
      data: req.body
    });
    res.status(201).json(simulation);
  } catch (error) {
    console.error('Error creating simulation:', error);
    res.status(500).json({ error: 'Failed to create simulation' });
  }
});

app.put('/api/simulations/:id', async (req, res) => {
  try {
    const simulation = await prisma.simulation.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(simulation);
  } catch (error) {
    console.error('Error updating simulation:', error);
    res.status(500).json({ error: 'Failed to update simulation' });
  }
});

app.delete('/api/simulations/:id', async (req, res) => {
  try {
    await prisma.simulation.delete({
      where: { id: req.params.id }
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting simulation:', error);
    res.status(500).json({ error: 'Failed to delete simulation' });
  }
});

// Projections API
app.post('/api/projections/simulate', async (req, res) => {
  try {
    const projectionData = req.body;
    
    // Simulação básica de projeção
    const result = {
      id: 'projection-' + Date.now(),
      clientId: projectionData.clientId,
      scenario: projectionData.scenario,
      wealthCurve: [
        { year: 2024, value: 100000 },
        { year: 2025, value: 120000 },
        { year: 2026, value: 145000 },
        { year: 2027, value: 175000 },
        { year: 2028, value: 210000 }
      ],
      projectedValue: 210000,
      timeHorizon: projectionData.timeHorizon || 5
    };
    
    res.json(result);
  } catch (error) {
    console.error('Error in projection simulation:', error);
    res.status(500).json({ error: 'Failed to simulate projection' });
  }
});

app.post('/api/projections/wealth-curve/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const params = req.body;
    
    // Simulação de curva de riqueza
    const wealthCurve = {
      clientId,
      data: [
        { period: '2024', conservative: 90000, moderate: 100000, aggressive: 110000 },
        { period: '2025', conservative: 105000, moderate: 120000, aggressive: 140000 },
        { period: '2026', conservative: 122000, moderate: 145000, aggressive: 175000 },
        { period: '2027', conservative: 142000, moderate: 175000, aggressive: 220000 },
        { period: '2028', conservative: 165000, moderate: 210000, aggressive: 275000 }
      ],
      scenarios: {
        conservative: { name: 'Conservador', growth: 0.06 },
        moderate: { name: 'Moderado', growth: 0.08 },
        aggressive: { name: 'Agressivo', growth: 0.12 }
      }
    };
    
    res.json(wealthCurve);
  } catch (error) {
    console.error('Error generating wealth curve:', error);
    res.status(500).json({ error: 'Failed to generate wealth curve' });
  }
});

// Wallet rebalancing
app.get('/api/wallets/rebalancing/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    
    // Simulação de rebalanceamento
    const rebalancing = {
      clientId,
      currentAllocation: [
        { asset: 'Ações', current: 60, target: 70, difference: 10 },
        { asset: 'Renda Fixa', current: 30, target: 25, difference: -5 },
        { asset: 'Fundos Imobiliários', current: 10, target: 5, difference: -5 }
      ],
      suggestions: [
        { action: 'Comprar', asset: 'Ações', amount: 15000 },
        { action: 'Vender', asset: 'Renda Fixa', amount: 7500 },
        { action: 'Vender', asset: 'Fundos Imobiliários', amount: 7500 }
      ],
      totalPortfolio: 150000
    };
    
    res.json(rebalancing);
  } catch (error) {
    console.error('Error calculating rebalancing:', error);
    res.status(500).json({ error: 'Failed to calculate rebalancing' });
  }
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
