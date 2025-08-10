import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const createKPISchema = z.object({
  category: z.string().min(1),
  percentage: z.number().min(0).max(100),
  indexer: z.string().optional().nullable(),
  custody: z.string().optional().nullable(),
  date: z.string().datetime().optional()
});

const updateKPISchema = createKPISchema.partial();

const querySchema = z.object({
  category: z.string().optional(),
  indexer: z.string().optional(),
  custody: z.string().optional(),
  groupBy: z.enum(['category', 'indexer', 'custody']).optional()
});

export const kpiController = {
  async create(req: Request, res: Response) {
    try {
      const data = createKPISchema.parse(req.body);
      
      const kpi = await prisma.kPIData.create({
        data: {
          ...data,
          date: data.date ? new Date(data.date) : new Date()
        }
      });

      res.status(201).json(kpi);
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
      if (query.category) where.category = query.category;
      if (query.indexer) where.indexer = query.indexer;
      if (query.custody) where.custody = query.custody;

      const kpis = await prisma.kPIData.findMany({
        where,
        orderBy: { date: 'desc' }
      });

      const summary = {
        totalPercentage: kpis.reduce((sum: number, kpi) => sum + kpi.percentage, 0),
        count: kpis.length,
        byCategory: kpis.reduce((acc: Record<string, number>, kpi) => {
          if (!acc[kpi.category]) acc[kpi.category] = 0;
          acc[kpi.category] += kpi.percentage;
          return acc;
        }, {} as Record<string, number>)
      };

      res.json({ kpis, summary });
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  async findById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const kpi = await prisma.kPIData.findUnique({
        where: { id }
      });

      if (!kpi) {
        return res.status(404).json({ message: 'KPI not found' });
      }

      res.json(kpi);
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = updateKPISchema.parse(req.body);

      const kpi = await prisma.kPIData.update({
        where: { id },
        data: {
          ...data,
          date: data.date ? new Date(data.date) : undefined
        }
      });

      res.json(kpi);
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

      await prisma.kPIData.delete({
        where: { id }
      });

      res.status(204).send();
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  async getByGroup(req: Request, res: Response) {
    try {
      const { groupBy = 'category' } = querySchema.parse(req.query);
      
      const kpis = await prisma.kPIData.findMany({
        orderBy: { date: 'desc' }
      });

      const grouped = kpis.reduce((acc: Record<string, any>, kpi) => {
        const key = kpi[groupBy as keyof typeof kpi] as string || 'others';
        if (!acc[key]) {
          acc[key] = {
            items: [],
            totalPercentage: 0,
            count: 0
          };
        }
        acc[key].items.push(kpi);
        acc[key].totalPercentage += kpi.percentage;
        acc[key].count += 1;
        return acc;
      }, {} as Record<string, any>);

      res.json(grouped);
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
};