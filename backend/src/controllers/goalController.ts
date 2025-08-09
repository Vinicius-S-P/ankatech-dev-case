import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const goalController = {
  async create(req: Request, res: Response) {
    try {
      const { name, targetValue, targetDate, clientId } = req.body;
      const goal = await prisma.goal.create({
        data: {
          name,
          targetValue,
          targetDate: new Date(targetDate),
          clientId,
          type: 'RETIREMENT' // Default type for simplicity
        }
      });
      res.status(201).json(goal);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  async findAll(req: Request, res: Response) {
    try {
      const goals = await prisma.goal.findMany();
      res.json(goals);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};