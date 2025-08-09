import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const clientController = {
  async create(req: Request, res: Response) {
    try {
      const { name, email, age } = req.body;
      const client = await prisma.client.create({
        data: {
          name,
          email,
          age
        }
      });
      res.status(201).json(client);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  async findAll(req: Request, res: Response) {
    try {
      const clients = await prisma.client.findMany();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};