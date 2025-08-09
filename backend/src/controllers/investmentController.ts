import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const investmentController = {
  async create(req: Request, res: Response) {
    try {
      const { name, type, currentValue, initialValue, percentChange, allocation } = req.body;
      const investment = await prisma.investment.create({
        data: {
          name,
          type,
          currentValue,
          initialValue,
          percentChange,
          allocation
        }
      });
      res.status(201).json(investment);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  async findAll(req: Request, res: Response) {
    try {
      const investments = await prisma.investment.findMany();
      res.json(investments);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};