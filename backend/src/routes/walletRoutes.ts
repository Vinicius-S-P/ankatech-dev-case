import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { PrismaClient, AssetClass } from '@prisma/client';

const prisma = new PrismaClient();

const createWalletSchema = z.object({
  clientId: z.string(),
  assetClass: z.nativeEnum(AssetClass),
  description: z.string().optional(),
  currentValue: z.number().positive(),
  percentage: z.number().min(0).max(100),
  targetPercentage: z.number().min(0).max(100).optional()
});

const updateWalletSchema = createWalletSchema.partial().omit({ clientId: true });

export default async function walletRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
) {
  fastify.get('/', {
    schema: {
      description: 'List all wallets',
      tags: ['wallets'],
      security: [{ Bearer: [] }]
    },
    preHandler: [(fastify as any).authenticate]
  }, async (request: any, reply) => {
    const { clientId } = request.query;
    const where: any = {};
    
    if (clientId) {
      where.clientId = clientId;
    }
    
    if (request.user.role === 'VIEWER') {
      where.client = { advisorId: request.user.id };
    }
    
    const wallets = await prisma.wallet.findMany({
      where,
      include: {
        client: {
          select: { name: true, email: true }
        }
      },
      orderBy: { percentage: 'desc' }
    });
    
    return reply.send({ wallets });
  });
  
  fastify.get('/portfolio/:clientId', {
    schema: {
      description: 'Get portfolio summary for a client',
      tags: ['wallets'],
      security: [{ Bearer: [] }]
    },
    preHandler: [(fastify as any).authenticate]
  }, async (request: any, reply) => {
    const { clientId } = request.params;
    
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        ...(request.user.role === 'VIEWER' ? { advisorId: request.user.id } : {})
      },
      include: { wallets: true }
    });
    
    if (!client) {
      return reply.status(404).send({ message: 'Client not found' });
    }
    
    const totalValue = client.wallets.reduce((sum, w) => sum + w.currentValue, 0);
    
    const byAssetClass = client.wallets.reduce((acc: any, wallet) => {
      if (!acc[wallet.assetClass]) {
        acc[wallet.assetClass] = {
          value: 0,
          percentage: 0,
          count: 0
        };
      }
      acc[wallet.assetClass].value += wallet.currentValue;
      acc[wallet.assetClass].count += 1;
      return acc;
    }, {});
    
    Object.keys(byAssetClass).forEach(assetClass => {
      byAssetClass[assetClass].percentage = totalValue > 0
        ? (byAssetClass[assetClass].value / totalValue) * 100
        : 0;
    });
    
    await prisma.client.update({
      where: { id: clientId },
      data: { totalWealth: totalValue }
    });
    
    return reply.send({
      clientId,
      totalValue,
      walletsCount: client.wallets.length,
      byAssetClass,
      wallets: client.wallets
    });
  });
  
  fastify.post('/', {
    schema: {
      description: 'Create a new wallet entry',
      tags: ['wallets'],
      security: [{ Bearer: [] }]
    },
    preHandler: [(fastify as any).authorize(['ADVISOR'])]
  }, async (request: any, reply) => {
    try {
      const data = createWalletSchema.parse(request.body);
      
      const client = await prisma.client.findFirst({
        where: {
          id: data.clientId,
          ...(request.user.role === 'VIEWER' ? { advisorId: request.user.id } : {})
        }
      });
      
      if (!client) {
        return reply.status(404).send({ message: 'Client not found' });
      }
      
      const wallet = await prisma.wallet.create({ data });
      
      await recalculatePortfolioPercentages(data.clientId);
      
      return reply.status(201).send(wallet);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          message: 'Validation Error',
          errors: error.flatten().fieldErrors
        });
      }
      throw error;
    }
  });
  
  fastify.put('/:id', {
    schema: {
      description: 'Update wallet entry',
      tags: ['wallets'],
      security: [{ Bearer: [] }]
    },
    preHandler: [(fastify as any).authorize(['ADVISOR'])]
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      const data = updateWalletSchema.parse(request.body);
      
      const existing = await prisma.wallet.findFirst({
        where: {
          id,
          ...(request.user.role === 'VIEWER' ? { advisorId: request.user.id } : {})
        }
      });
      
      if (!existing) {
        return reply.status(404).send({ message: 'Wallet not found' });
      }
      
      const wallet = await prisma.wallet.update({
        where: { id },
        data
      });
      
      await recalculatePortfolioPercentages(existing.clientId);
      
      return reply.send(wallet);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          message: 'Validation Error',
          errors: error.flatten().fieldErrors
        });
      }
      throw error;
    }
  });
  
  fastify.delete('/:id', {
    schema: {
      description: 'Delete wallet entry',
      tags: ['wallets'],
      security: [{ Bearer: [] }]
    },
    preHandler: [(fastify as any).authorize(['ADVISOR'])]
  }, async (request: any, reply) => {
    const { id } = request.params;
    
    const existing = await prisma.wallet.findFirst({
      where: {
        id,
        ...(request.user.role === 'VIEWER' ? { advisorId: request.user.id } : {})
      }
    });
    
    if (!existing) {
      return reply.status(404).send({ message: 'Wallet not found' });
    }
    
    await prisma.wallet.delete({ where: { id } });
    
    await recalculatePortfolioPercentages(existing.clientId);
    
    return reply.status(204).send();
  });
  
  fastify.post('/rebalance/:clientId', {
    schema: {
      description: 'Suggest portfolio rebalancing',
      tags: ['wallets'],
      security: [{ Bearer: [] }]
    },
    preHandler: [(fastify as any).authenticate]
  }, async (request: any, reply) => {
    const { clientId } = request.params;
    const { targetAllocation } = request.body;
    
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        ...(request.user.role === 'VIEWER' ? { advisorId: request.user.id } : {})
      },
      include: { wallets: true }
    });
    
    if (!client) {
      return reply.status(404).send({ message: 'Client not found' });
    }
    
    const totalValue = client.wallets.reduce((sum, w) => sum + w.currentValue, 0);
    const suggestions = [];
    
    for (const [assetClass, targetPercentage] of Object.entries(targetAllocation)) {
      const currentWallets = client.wallets.filter(w => w.assetClass === assetClass);
      const currentValue = currentWallets.reduce((sum, w) => sum + w.currentValue, 0);
      const currentPercentage = totalValue > 0 ? (currentValue / totalValue) * 100 : 0;
      const targetValue = totalValue * (targetPercentage as number) / 100;
      const difference = targetValue - currentValue;
      
      if (Math.abs(difference) > 100) {
        suggestions.push({
          assetClass,
          currentValue,
          currentPercentage,
          targetPercentage,
          targetValue,
          difference,
          action: difference > 0 ? 'BUY' : 'SELL'
        });
      }
    }
    
    return reply.send({
      totalValue,
      suggestions: suggestions.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference))
    });
  });
}

async function recalculatePortfolioPercentages(clientId: string) {
  const wallets = await prisma.wallet.findMany({
    where: { clientId }
  });
  
  const totalValue = wallets.reduce((sum, w) => sum + w.currentValue, 0);
  
  if (totalValue > 0) {
    for (const wallet of wallets) {
      const percentage = (wallet.currentValue / totalValue) * 100;
      await prisma.wallet.update({
        where: { id: wallet.id },
        data: { percentage }
      });
    }
  }
  
  await prisma.client.update({
    where: { id: clientId },
    data: { totalWealth: totalValue }
  });
}
