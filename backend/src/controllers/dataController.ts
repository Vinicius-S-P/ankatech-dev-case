import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { CreateDataInput, UpdateDataInput, FilterInput } from '../utils/validation';
import { PaginationResponse, SummaryData } from '../types';

const prisma = new PrismaClient();

export class DataController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data: CreateDataInput = req.body;
      
      const result = await prisma.data.create({
        data: {
          label: data.label,
          value: data.value,
          category: data.category,
          date: data.date ? new Date(data.date) : new Date()
        }
      });

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = req.query as unknown as FilterInput;
      const page = Number(filters.page) || 1;
      const limit = Number(filters.limit) || 10;
      const skip = (page - 1) * limit;

      const where: any = {};

      if (filters.category) {
        where.category = filters.category;
      }

      if (filters.startDate || filters.endDate) {
        where.date = {};
        if (filters.startDate) {
          where.date.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          where.date.lte = new Date(filters.endDate);
        }
      }

      const [data, total] = await Promise.all([
        prisma.data.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            [filters.sort || 'date']: filters.order || 'desc'
          }
        }),
        prisma.data.count({ where })
      ]);

      const response: PaginationResponse<any> = {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const data = await prisma.data.findUnique({
        where: { id }
      });

      if (!data) {
        throw new AppError('Data not found', 404, 'NOT_FOUND');
      }

      res.json(data);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updateData: UpdateDataInput = req.body;

      const data = await prisma.data.update({
        where: { id },
        data: {
          ...(updateData.label && { label: updateData.label }),
          ...(updateData.value !== undefined && { value: updateData.value }),
          ...(updateData.category && { category: updateData.category }),
          ...(updateData.date && { date: new Date(updateData.date) })
        }
      });

      res.json(data);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      await prisma.data.delete({
        where: { id }
      });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = req.query as unknown as FilterInput;
      
      const where: any = {};
      if (filters.startDate || filters.endDate) {
        where.date = {};
        if (filters.startDate) {
          where.date.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          where.date.lte = new Date(filters.endDate);
        }
      }

      const categories = ['plano_original', 'situacao_atual', 'custo_vida'];
      const summaries: SummaryData[] = [];

      for (const category of categories) {
        const categoryData = await prisma.data.findMany({
          where: { ...where, category }
        });

        if (categoryData.length > 0) {
          const values = categoryData.map((d: any) => d.value);
          const total = values.reduce((sum: number, val: number) => sum + val, 0);
          const average = total / values.length;
          const min = Math.min(...values);
          const max = Math.max(...values);

          summaries.push({
            category: category as any,
            total,
            average,
            min,
            max,
            count: categoryData.length
          });
        } else {
          summaries.push({
            category: category as any,
            total: 0,
            average: 0,
            min: 0,
            max: 0,
            count: 0
          });
        }
      }

      res.json(summaries);
    } catch (error) {
      next(error);
    }
  }

  async getByCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = req.query as unknown as FilterInput;
      
      const where: any = {};
      if (filters.startDate || filters.endDate) {
        where.date = {};
        if (filters.startDate) {
          where.date.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          where.date.lte = new Date(filters.endDate);
        }
      }

      const categories = ['plano_original', 'situacao_atual', 'custo_vida'];
      const result: Record<string, any[]> = {};

      for (const category of categories) {
        result[category] = await prisma.data.findMany({
          where: { ...where, category },
          orderBy: { date: 'desc' }
        });
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getTimeline(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = req.query as unknown as FilterInput;
      
      const where: any = {};
      if (filters.category) {
        where.category = filters.category;
      }
      if (filters.startDate || filters.endDate) {
        where.date = {};
        if (filters.startDate) {
          where.date.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          where.date.lte = new Date(filters.endDate);
        }
      }

      const data = await prisma.data.findMany({
        where,
        orderBy: { date: 'asc' },
        select: {
          id: true,
          label: true,
          value: true,
          category: true,
          date: true
        }
      });

      const groupedData = data.reduce((acc: any, item: any) => {
        const dateKey = item.date.toISOString().split('T')[0];
        
        if (!acc[dateKey]) {
          acc[dateKey] = {
            date: dateKey,
            plano_original: 0,
            situacao_atual: 0,
            custo_vida: 0
          };
        }
        
        acc[dateKey][item.category] += item.value;
        
        return acc;
      }, {});

      const timeline = Object.values(groupedData).sort((a: any, b: any) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      res.json(timeline);
    } catch (error) {
      next(error);
    }
  }
}

export const dataController = new DataController();

