// Mock prisma client for tests
let deletedClients: string[] = [];

const mockPrisma = {
  $connect: jest.fn().mockResolvedValue(undefined),
  $disconnect: jest.fn().mockResolvedValue(undefined),
  wallet: {
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
    count: jest.fn().mockResolvedValue(0),
  },
  goal: {
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
    count: jest.fn().mockResolvedValue(0),
  },
  event: {
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
    count: jest.fn().mockResolvedValue(0),
  },
  insurance: {
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
    count: jest.fn().mockResolvedValue(0),
  },
  simulation: {
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
    count: jest.fn().mockResolvedValue(0),
  },
  client: {
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    findMany: jest.fn().mockImplementation((args) => {
      // For pagination test, return test clients
      const testClients = [
        { 
          id: '1', 
          name: 'Alice Smith', 
          email: 'alice@example.com', 
          age: 30, 
          active: true,
          familyProfile: [],
          totalWealth: 100000,
          alignmentPercentage: 80,
          _count: { goals: 2, wallets: 3, events: 5 }
        },
        { 
          id: '2', 
          name: 'Bob Johnson', 
          email: 'bob@example.com', 
          age: 45, 
          active: true,
          familyProfile: [],
          totalWealth: 250000,
          alignmentPercentage: 90,
          _count: { goals: 1, wallets: 2, events: 3 }
        },
        { 
          id: '3', 
          name: 'Charlie Brown', 
          email: 'charlie@example.com', 
          age: 25, 
          active: true,
          familyProfile: [],
          totalWealth: 50000,
          alignmentPercentage: 60,
          _count: { goals: 3, wallets: 1, events: 2 }
        }
      ];
      
      // Filter out deleted clients
      const availableClients = testClients.filter(client => !deletedClients.includes(client.id));
      
      // Handle search
      if (args.where && args.where.OR) {
        const search = args.where.OR[0].name.contains || args.where.OR[1].email.contains;
        if (search.includes('Alice')) {
          return Promise.resolve(availableClients.filter(client => client.name.includes('Alice')));
        }
        if (search.includes('bob') || search.includes('bob@example.com')) {
          return Promise.resolve(availableClients.filter(client => client.name.includes('Bob') || client.email.includes('bob')));
        }
        return Promise.resolve([]);
      }
      
      // Handle pagination
      if (args.skip !== undefined && args.take !== undefined) {
        const start = args.skip;
        const end = start + args.take;
        return Promise.resolve(availableClients.slice(start, end));
      }
      
      return Promise.resolve(availableClients);
    }),
    findUnique: jest.fn().mockImplementation((args) => {
      // Check if client was deleted
      if (deletedClients.includes(args.where.id)) {
        return Promise.resolve(null);
      }
      
      if (args.where.id === 'test-client-1') {
        return Promise.resolve({
          id: 'test-client-1',
          name: 'Test Client Detail',
          email: 'test@example.com',
          age: 30,
          active: true,
          familyProfile: [],
          totalWealth: 150000,
          alignmentPercentage: 75,
          createdAt: new Date(),
          updatedAt: new Date(),
          goals: [],
          wallets: [],
          events: [],
          insurance: []
        });
      }
      return Promise.resolve(null);
    }),
    create: jest.fn().mockImplementation((args) => {
      return Promise.resolve({
        id: 'test-client-1',
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }),
    createMany: jest.fn().mockResolvedValue({ count: 3 }),
    update: jest.fn().mockImplementation((args) => {
      return Promise.resolve({
        id: args.where.id,
        ...args.data,
        name: args.data.name || 'Updated Name',
        email: args.data.email || 'updated@example.com',
        age: args.data.age || 35,
        active: args.data.active !== undefined ? args.data.active : true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }),
    delete: jest.fn().mockImplementation((args) => {
      if (args.where.id === 'test-client-1') {
        deletedClients.push(args.where.id);
        return Promise.resolve({
          id: 'test-client-1',
          name: 'Test Client Detail',
          email: 'test@example.com',
          age: 30,
          active: true,
          familyProfile: [],
          totalWealth: 150000,
          alignmentPercentage: 75,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      return Promise.resolve(null);
    }),
    count: jest.fn().mockImplementation((args) => {
      // For search
      if (args.where && args.where.OR) {
        const search = args.where.OR[0].name.contains || args.where.OR[1].email.contains;
        if (search.includes('Alice')) {
          return Promise.resolve(1);
        }
        if (search.includes('bob') || search.includes('bob@example.com')) {
          return Promise.resolve(1);
        }
        return Promise.resolve(0);
      }
      // Default count
      return Promise.resolve(3);
    }),
  },
  kPIData: {
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
    count: jest.fn().mockResolvedValue(0),
  },
  investment: {
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
    count: jest.fn().mockResolvedValue(0),
  },
  allocation: {
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
    count: jest.fn().mockResolvedValue(0),
  },
}

// Setup before all tests
beforeAll(async () => {
  // Mock database connection
  await mockPrisma.$connect()
})

// Cleanup after all tests
afterAll(async () => {
  // Clean up test data
  await mockPrisma.wallet.deleteMany()
  await mockPrisma.goal.deleteMany()
  await mockPrisma.event.deleteMany()
  await mockPrisma.insurance.deleteMany()
  await mockPrisma.simulation.deleteMany()
  await mockPrisma.client.deleteMany()
  
  // Disconnect
  await mockPrisma.$disconnect()
})

// Reset database between tests
beforeEach(async () => {
  // Clean up test data before each test
  deletedClients = [];
  await mockPrisma.wallet.deleteMany()
  await mockPrisma.goal.deleteMany()
  await mockPrisma.event.deleteMany()
  await mockPrisma.insurance.deleteMany()
  await mockPrisma.simulation.deleteMany()
  await mockPrisma.client.deleteMany()
})

export { mockPrisma as prisma }
