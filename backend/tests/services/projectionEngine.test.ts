import { simulateWealthCurve, calculateRequiredContribution } from '../../src/services/projectionEngine'
import { prisma } from '../setup'

// Mock the prisma module
jest.mock('../../src/prisma', () => ({
  prisma: {
    goal: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    event: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    client: {
      findUnique: jest.fn().mockResolvedValue({ id: 'test-client-1' }),
    },
  },
}))

describe('ProjectionEngine', () => {
  describe('simulateWealthCurve', () => {
    beforeEach(async () => {
      // Create test client
      await prisma.client.create({
        data: {
          id: 'test-client-1',
          name: 'Test Client',
          email: 'test@example.com',
          age: 35,
          active: true
        }
      })
    })

    it('should calculate compound growth correctly', async () => {
      const params = {
        clientId: 'test-client-1',
        initialWealth: 100000,
        realRate: 0.04,
        startYear: 2020,
        endYear: 2025,
        includeEvents: false
      }
      
      const result = await simulateWealthCurve(params)
      
      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      
      // Test compound growth calculation
      const firstYear = result[0]
      expect(firstYear.endValue).toBeCloseTo(104000, 1)
      expect(firstYear.year).toBe(2020)
    })

    it('should process recurring events correctly', async () => {
      // Create test event
      await prisma.event.create({
        data: {
          clientId: 'test-client-1',
          type: 'INCOME',
          name: 'Monthly contribution',
          description: 'Monthly contribution', 
          value: 1000,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          frequency: 'MONTHLY'
        }
      })

      const params = {
        clientId: 'test-client-1',
        initialWealth: 100000,
        realRate: 0.04,
        startYear: 2020,
        endYear: 2025,
        includeEvents: true
      }
      
      const result = await simulateWealthCurve(params)
      
      expect(result).toBeDefined()
      expect(result.length).toBeGreaterThan(0)
      
      // With monthly contributions, end value should be higher
      const firstYear = result[0]
      expect(firstYear.endValue).toBeGreaterThanOrEqual(104000)
    })

    it('should handle edge cases', async () => {
      const params = {
        clientId: 'test-client-1',
        initialWealth: 0,
        realRate: 0,
        startYear: 2020,
        endYear: 2025,
        includeEvents: false
      }
      
      const result = await simulateWealthCurve(params)
      
      expect(result).toBeDefined()
      expect(result[0].endValue).toBe(0)
    })

    it('should handle negative real rate', async () => {
      const params = {
        clientId: 'test-client-1',
        initialWealth: 100000,
        realRate: -0.02,
        startYear: 2020,
        endYear: 2025,
        includeEvents: false
      }
      
      const result = await simulateWealthCurve(params)
      
      expect(result).toBeDefined()
      expect(result[0].endValue).toBeLessThan(100000)
    })
  })

  describe('calculateRequiredContribution', () => {
    it('should calculate contribution accurately', () => {
      const result = calculateRequiredContribution(
        100000, // current
        500000, // target  
        10,     // years
        0.04    // rate
      )
      
      expect(result).toBeGreaterThan(0)
      expect(typeof result).toBe('number')
      expect(result).toBeCloseTo(29316, 0) // Approximate PMT calculation
    })

    it('should handle zero years', () => {
      const result = calculateRequiredContribution(
        100000, // current
        500000, // target  
        0,      // years
        0.04    // rate
      )
      
      expect(result).toBe(400000) // Full gap needs to be covered immediately
    })

    it('should handle zero rate', () => {
      const result = calculateRequiredContribution(
        100000, // current
        500000, // target  
        10,     // years
        0       // rate
      )
      
      expect(result).toBe(40000) // Simple division without compound interest
    })

    it('should handle current > target', () => {
      const result = calculateRequiredContribution(
        500000, // current
        100000, // target  
        10,     // years
        0.04    // rate
      )
      
      expect(result).toBe(0) // No contribution needed
    })
  })
})
