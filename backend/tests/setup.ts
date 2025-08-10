import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Setup before all tests
beforeAll(async () => {
  // Connect to test database
  await prisma.$connect()
})

// Cleanup after all tests
afterAll(async () => {
  // Clean up test data
  await prisma.wallet.deleteMany()
  await prisma.goal.deleteMany()
  await prisma.event.deleteMany()
  await prisma.insurance.deleteMany()
  await prisma.simulation.deleteMany()
  await prisma.client.deleteMany()
  
  // Disconnect
  await prisma.$disconnect()
})

// Reset database between tests
beforeEach(async () => {
  // Clean up test data before each test
  await prisma.wallet.deleteMany()
  await prisma.goal.deleteMany()
  await prisma.event.deleteMany()
  await prisma.insurance.deleteMany()
  await prisma.simulation.deleteMany()
  await prisma.client.deleteMany()
})

export { prisma }
