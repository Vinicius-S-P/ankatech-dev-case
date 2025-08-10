import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const createAllocationSchema = z.object({
  totalAllocated: z.number().positive(),
  emergencyExpected: z.number().min(0).optional(),
  emergencyActual: z.number().min(0).optional(),
  date: z.string().datetime().optional()
});

const updateAllocationSchema = createAllocationSchema.partial();

const querySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.string().transform(Number).optional()
});

export const allocationController = {
  async create(req: Request, res: Response) {
    try {
      const data = createAllocationSchema.parse(req.body);
      
      const allocation = await prisma.allocation.create({
        data: {
          ...data,
          date: data.date ? new Date(data.date) : new Date()
        }
      });

      res.status(201).json(allocation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  async getCurrent(req: Request, res: Response) {
    try {
      const allocation = await prisma.allocation.findFirst({
        orderBy: { date: 'desc' }
      });

      if (!allocation) {
        return res.status(404).json({ message: 'No allocation found' });
      }

      res.json(allocation);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  async getHistory(req: Request, res: Response) {
    try {
      const query = querySchema.parse(req.query);
      
      const where: any = {};
      if (query.startDate || query.endDate) {
        where.date = {};
        if (query.startDate) where.date.gte = new Date(query.startDate);
        if (query.endDate) where.date.lte = new Date(query.endDate);
      }

      const allocations = await prisma.allocation.findMany({
        where,
        orderBy: { date: 'desc' },
        take: query.limit || 50
      });

      res.json(allocations);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = updateAllocationSchema.parse(req.body);

      const allocation = await prisma.allocation.update({
        where: { id },
        data: {
          ...data,
          date: data.date ? new Date(data.date) : undefined
        }
      });

      res.json(allocation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await prisma.allocation.delete({
        where: { id }
      });

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};