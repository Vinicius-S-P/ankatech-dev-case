import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const createGoalSchema = z.object({
  retirementAge: z.number().int().positive(),
  monthlyIncome: z.number().positive(),
  targetReturn: z.string().min(1),
  currentProgress: z.number().min(0).optional(),
  targetAmount: z.number().positive(),
  annualContribution: z.number().min(0).optional(),
  date: z.string().datetime().optional()
});

const updateGoalSchema = createGoalSchema.partial();

export const goalController = {
  async create(req: Request, res: Response) {
    try {
      const data = createGoalSchema.parse(req.body);
      
      const goal = await prisma.goal.create({
        data: {
          ...data,
          date: data.date ? new Date(data.date) : new Date()
        }
      });

      res.status(201).json(goal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.flatten().fieldErrors });
      }
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  async findAll(_req: Request, res: Response) {
    try {
      const goals = await prisma.goal.findMany({
        orderBy: { date: 'desc' }
      });

      res.json(goals);
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  async getCurrent(_req: Request, res: Response) {
    try {
      const goal = await prisma.goal.findFirst({
        orderBy: { date: 'desc' }
      });

      if (!goal) {
        return res.status(404).json({ message: 'No goal found' });
      }

      const currentAge = 35;
      const monthsToRetirement = (goal.retirementAge - currentAge) * 12;
      const monthlyContribution = goal.annualContribution / 12;
      const requiredMonthlyReturn = (goal.monthlyIncome * 12) / goal.targetAmount;
      const projectedValue = goal.targetAmount * (1 + goal.currentProgress / 100);

      res.json({
        ...goal,
        monthsToRetirement,
        monthlyContribution,
        requiredMonthlyReturn,
        projectedValue
      });
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  async findById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const goal = await prisma.goal.findUnique({
        where: { id }
      });

      if (!goal) {
        return res.status(404).json({ message: 'Goal not found' });
      }

      res.json(goal);
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = updateGoalSchema.parse(req.body);

      const goal = await prisma.goal.update({
        where: { id },
        data: {
          ...data,
          date: data.date ? new Date(data.date) : undefined
        }
      });

      res.json(goal);
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

      await prisma.goal.delete({
        where: { id }
      });

      res.status(204).send();
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
};