import { Request, Response } from 'express';
import { PrismaClient, GoalType } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const createGoalSchema = z.object({
  clientId: z.string(),
  type: z.nativeEnum(GoalType),
  name: z.string(),
  description: z.string().optional(),
  targetValue: z.number().positive(),
  targetDate: z.string().datetime(),
  currentValue: z.number().min(0).optional(),
  monthlyIncome: z.number().positive().optional()
});

const updateGoalSchema = createGoalSchema.partial();

export const goalController = {
  async create(req: Request, res: Response) {
    try {
      const data = createGoalSchema.parse(req.body);
      
      const goal = await prisma.goal.create({
        data: {
          ...data,
          targetDate: new Date(data.targetDate),
        }
      });

      return res.status(201).json(goal);
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
        orderBy: { targetDate: 'desc' }
      });

      return res.json(goals);
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  async getCurrent(_req: Request, res: Response) {
    try {
      const goal = await prisma.goal.findFirst({
        orderBy: { targetDate: 'desc' }
      });

      if (!goal) {
        return res.status(404).json({ message: 'No goal found' });
      }

      const yearsToTarget = goal.targetDate.getFullYear() - new Date().getFullYear();
      const monthsToTarget = yearsToTarget * 12;
      const monthlyContribution = goal.currentValue / monthsToTarget;
      const requiredMonthlyReturn = (goal.monthlyIncome || 0) * 12 / goal.targetValue;
      const projectedValue = goal.targetValue * (1 + (goal.currentValue / goal.targetValue));

      return res.json({
        ...goal,
        monthsToTarget,
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

      return res.json(goal);
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
          targetDate: data.targetDate ? new Date(data.targetDate) : undefined
        }
      });

      return res.json(goal);
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

      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
};