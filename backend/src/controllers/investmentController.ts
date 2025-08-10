import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Definir enums locais para evitar erro do Prisma
const InvestmentTypeEnum = z.enum(['STOCKS', 'BONDS', 'FUNDS', 'REAL_ESTATE', 'CRYPTO', 'OTHER'])
const AssetTypeEnum = z.enum(['EQUITY', 'FIXED_INCOME', 'ALTERNATIVES', 'CASH'])

const createInvestmentSchema = z.object({
  name: z.string().min(1),
  type: InvestmentTypeEnum,
  assetType: AssetTypeEnum,
  currentValue: z.number().positive(),
  initialValue: z.number().positive(),
  percentChange: z.number().optional(),
  allocation: z.number().optional(),
  date: z.string().datetime().optional()
});

const updateInvestmentSchema = createInvestmentSchema.partial();

const querySchema = z.object({
  assetType: AssetTypeEnum.optional(),
  type: InvestmentTypeEnum.optional()
});

export const investmentController = {
  async create(req: Request, res: Response) {
    try {
      const data = createInvestmentSchema.parse(req.body);
      
      const investment = await prisma.investment.create({
        data: {
          ...data,
          date: data.date ? new Date(data.date) : new Date()
        }
      });

      return res.status(201).json(investment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.flatten().fieldErrors });
      }
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  async findAll(req: Request, res: Response) {
    try {
      const query = querySchema.parse(req.query);
      
      const where: any = {};
      if (query.assetType) where.assetType = query.assetType;
      if (query.type) where.type = query.type;

      const investments = await prisma.investment.findMany({
        where,
        orderBy: { date: 'desc' }
      });

      const summary = {
        total: investments.reduce((sum: number, inv) => sum + inv.currentValue, 0),
        count: investments.length,
        byAssetType: {
          FINANCEIRA: investments
            .filter((inv) => inv.assetType === 'FINANCEIRA')
            .reduce((sum: number, inv) => sum + inv.currentValue, 0),
          IMOBILIZADA: investments
            .filter((inv) => inv.assetType === 'IMOBILIZADA')
            .reduce((sum: number, inv) => sum + inv.currentValue, 0)
        }
      };

      res.json({ investments, summary });
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  async findById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const investment = await prisma.investment.findUnique({
        where: { id }
      });

      if (!investment) {
        return res.status(404).json({ message: 'Investment not found' });
      }

      return res.json(investment);
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = updateInvestmentSchema.parse(req.body);
      
      const investment = await prisma.investment.update({
        where: { id },
        data: {
          ...data,
          date: data.date ? new Date(data.date) : undefined
        }
      });

      return res.json(investment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.flatten().fieldErrors });
      }
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      await prisma.investment.delete({
        where: { id }
      });

      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  async getByAssetType(_req: Request, res: Response) {
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

      return res.json({ financial, realEstate, total });
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
};
