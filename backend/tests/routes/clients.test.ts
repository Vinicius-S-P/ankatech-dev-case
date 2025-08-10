import request from 'supertest'
import express from 'express'
import { prisma } from '../setup'
import cors from 'cors'
import { Prisma } from '@prisma/client'

// Mock Express app for testing
const app = express()
app.use(express.json())
app.use(cors())

// Basic routes for testing
app.get('/api/clients', async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query
    const skip = (Number(page) - 1) * Number(limit)
    
    const where = search ? {
      OR: [
        { name: { contains: search as string, mode: Prisma.QueryMode.insensitive } },
        { email: { contains: search as string, mode: Prisma.QueryMode.insensitive } }
      ]
    } : {}
    
    const clients = await prisma.client.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' }
    })
    
    const total = await prisma.client.count({ where })
    
    return res.json({
      clients,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch clients' })
  }
})

app.post('/api/clients', async (req, res) => {
  try {
    const { name, email, age } = req.body
    
    if (!name || !email || !age) {
      return res.status(400).json({ error: 'Missing required fields' })
    }
    
    const client = await prisma.client.create({
      data: {
        name,
        email,
        age: Number(age),
        active: true
      }
    })
    
    return res.status(201).json(client)
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create client' })
  }
})

app.get('/api/clients/:id', async (req, res) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: {
        goals: true,
        wallets: true,
        events: true,
        insurance: true
      }
    })
    
    if (!client) {
      return res.status(404).json({ error: 'Client not found' })
    }
    
    return res.json(client)
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch client' })
  }
})

app.put('/api/clients/:id', async (req, res) => {
  try {
    const { name, email, age } = req.body
    
    const client = await prisma.client.update({
      where: { id: req.params.id },
      data: {
        name,
        email,
        age: Number(age)
      }
    })
    
    return res.json(client)
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update client' })
  }
})

app.delete('/api/clients/:id', async (req, res) => {
  try {
    await prisma.client.delete({
      where: { id: req.params.id }
    })
    
    return res.status(204).send()
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete client' })
  }
})

describe('Client Routes', () => {
  describe('POST /api/clients', () => {
    it('should create client with valid data', async () => {
      const clientData = {
        name: 'Test Client',
        email: 'test@example.com',
        age: 35
      }
      
      const response = await request(app)
        .post('/api/clients')
        .send(clientData)
        .expect(201)
        
      expect(response.body.name).toBe('Test Client')
      expect(response.body.email).toBe('test@example.com')
      expect(response.body.age).toBe(35)
      expect(response.body.active).toBe(true)
      expect(response.body.id).toBeDefined()
    })

    it('should return 400 for missing fields', async () => {
      const response = await request(app)
        .post('/api/clients')
        .send({ name: 'Test Client' })
        .expect(400)
        
      expect(response.body.error).toBe('Missing required fields')
    })
  })

  describe('GET /api/clients', () => {
    beforeEach(async () => {
      // Create test clients
      await prisma.client.createMany({
        data: [
          { name: 'Alice Smith', email: 'alice@example.com', age: 30, active: true },
          { name: 'Bob Johnson', email: 'bob@example.com', age: 45, active: true },
          { name: 'Charlie Brown', email: 'charlie@example.com', age: 25, active: true }
        ]
      })
    })

    it('should return paginated clients', async () => {
      const response = await request(app)
        .get('/api/clients?page=1&limit=2')
        .expect(200)
        
      expect(response.body.clients).toHaveLength(2)
      expect(response.body.pagination.page).toBe(1)
      expect(response.body.pagination.limit).toBe(2)
      expect(response.body.pagination.total).toBe(3)
      expect(response.body.pagination.totalPages).toBe(2)
    })

    it('should search clients by name', async () => {
      const response = await request(app)
        .get('/api/clients?search=Alice')
        .expect(200)
        
      expect(response.body.clients).toHaveLength(1)
      expect(response.body.clients[0].name).toBe('Alice Smith')
    })

    it('should search clients by email', async () => {
      const response = await request(app)
        .get('/api/clients?search=bob@example.com')
        .expect(200)
        
      expect(response.body.clients).toHaveLength(1)
      expect(response.body.clients[0].email).toBe('bob@example.com')
    })
  })

  describe('GET /api/clients/:id', () => {
    let testClient: any

    beforeEach(async () => {
      testClient = await prisma.client.create({
        data: {
          name: 'Test Client Detail',
          email: 'detail@example.com',
          age: 40,
          active: true
        }
      })
    })

    it('should return client with related data', async () => {
      const response = await request(app)
        .get(`/api/clients/${testClient.id}`)
        .expect(200)
        
      expect(response.body.id).toBe(testClient.id)
      expect(response.body.name).toBe('Test Client Detail')
      expect(response.body.goals).toBeDefined()
      expect(response.body.wallets).toBeDefined()
      expect(response.body.events).toBeDefined()
      expect(response.body.insurance).toBeDefined()
    })

    it('should return 404 for non-existent client', async () => {
      const response = await request(app)
        .get('/api/clients/non-existent-id')
        .expect(404)
        
      expect(response.body.error).toBe('Client not found')
    })
  })

  describe('PUT /api/clients/:id', () => {
    let testClient: any

    beforeEach(async () => {
      testClient = await prisma.client.create({
        data: {
          name: 'Original Name',
          email: 'original@example.com',
          age: 30,
          active: true
        }
      })
    })

    it('should update client data', async () => {
      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com',
        age: 35
      }
      
      const response = await request(app)
        .put(`/api/clients/${testClient.id}`)
        .send(updateData)
        .expect(200)
        
      expect(response.body.name).toBe('Updated Name')
      expect(response.body.email).toBe('updated@example.com')
      expect(response.body.age).toBe(35)
    })
  })

  describe('DELETE /api/clients/:id', () => {
    let testClient: any

    beforeEach(async () => {
      testClient = await prisma.client.create({
        data: {
          name: 'Client to Delete',
          email: 'delete@example.com',
          age: 30,
          active: true
        }
      })
    })

    it('should delete client', async () => {
      await request(app)
        .delete(`/api/clients/${testClient.id}`)
        .expect(204)
        
      // Verify client is deleted
      const deletedClient = await prisma.client.findUnique({
        where: { id: testClient.id }
      })
      
      expect(deletedClient).toBeNull()
    })
  })
})

export { app }
