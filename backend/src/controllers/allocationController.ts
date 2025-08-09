import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const allocationController = {
  async create(req: Request, res: Response) {
    try {
      const { totalAllocated, emergencyExpected, emergencyActual } = req.body;
      const allocation = await prisma.allocation.create({
        data: {
          totalAllocated,
          emergencyExpected,
          emergencyActual
        }
      });
      res.status(201).json(allocation);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  async findAll(req: Request, res: Response) {
    try {
      const allocations = await prisma.allocation.findMany();
      res.json(allocations);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};