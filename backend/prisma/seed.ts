import { PrismaClient, UserRole, GoalType, EventType, Frequency, InsuranceType, AssetClass } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with new models...');

  // Create users
  const advisorPassword = await bcrypt.hash('123456', 10);
  const viewerPassword = await bcrypt.hash('123456', 10);

  const advisor = await prisma.user.upsert({
    where: { email: 'advisor@mfoffice.com' },
    update: {},
    create: {
      email: 'advisor@mfoffice.com',
      password: advisorPassword,
      name: 'João Silva',
      role: UserRole.ADVISOR
    }
  });

  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@mfoffice.com' },
    update: {},
    create: {
      email: 'viewer@mfoffice.com',
      password: viewerPassword,
      name: 'Maria Santos',
      role: UserRole.VIEWER
    }
  });

  console.log('Created users:', { advisor, viewer });

  // Create clients
  const client1 = await prisma.client.create({
    data: {
      name: 'Carlos Oliveira',
      email: 'carlos@example.com',
      age: 45,
      familyProfile: 'Casado, 2 filhos (15 e 12 anos)',
      advisorId: advisor.id
    }
  });

  const client2 = await prisma.client.create({
    data: {
      name: 'Ana Costa',
      email: 'ana@example.com',
      age: 38,
      familyProfile: 'Solteira, sem filhos',
      advisorId: advisor.id
    }
  });

  console.log('Created clients:', { client1, client2 });

  // Create wallets for client1
  await prisma.wallet.createMany({
    data: [
      {
        clientId: client1.id,
        assetClass: AssetClass.STOCKS,
        description: 'Ações brasileiras (B3)',
        currentValue: 450000,
        percentage: 30
      },
      {
        clientId: client1.id,
        assetClass: AssetClass.BONDS,
        description: 'Renda fixa (CDB, LCI, LCA)',
        currentValue: 300000,
        percentage: 20
      },
      {
        clientId: client1.id,
        assetClass: AssetClass.REAL_ESTATE,
        description: 'Fundos imobiliários',
        currentValue: 150000,
        percentage: 10
      },
      {
        clientId: client1.id,
        assetClass: AssetClass.CRYPTO,
        description: 'Bitcoin e Ethereum',
        currentValue: 100000,
        percentage: 6.67
      },
      {
        clientId: client1.id,
        assetClass: AssetClass.CASH,
        description: 'Reserva de emergência',
        currentValue: 500000,
        percentage: 33.33
      }
    ]
  });

  // Create goals for client1
  const retirementGoal = await prisma.goal.create({
    data: {
      clientId: client1.id,
      type: GoalType.RETIREMENT,
      name: 'Aposentadoria aos 65 anos',
      description: 'Manter padrão de vida atual na aposentadoria',
      targetValue: 5000000,
      targetDate: new Date('2044-01-01'),
      currentValue: 1500000,
      monthlyIncome: 25000
    }
  });

  const educationGoal = await prisma.goal.create({
    data: {
      clientId: client1.id,
      type: GoalType.MEDIUM_TERM,
      name: 'Educação dos filhos',
      description: 'Faculdade e intercâmbio',
      targetValue: 800000,
      targetDate: new Date('2028-01-01'),
      currentValue: 200000
    }
  });

  console.log('Created goals:', { retirementGoal, educationGoal });

  // Create events for client1
  await prisma.event.createMany({
    data: [
      {
        clientId: client1.id,
        type: EventType.INCOME,
        name: 'Salário',
        description: 'Salário mensal líquido',
        value: 35000,
        frequency: Frequency.MONTHLY,
        startDate: new Date('2024-01-01')
      },
      {
        clientId: client1.id,
        type: EventType.EXPENSE,
        name: 'Despesas familiares',
        description: 'Gastos mensais da família',
        value: 25000,
        frequency: Frequency.MONTHLY,
        startDate: new Date('2024-01-01')
      },
      {
        clientId: client1.id,
        type: EventType.DEPOSIT,
        name: 'Investimento mensal',
        description: 'Aporte regular em investimentos',
        value: 10000,
        frequency: Frequency.MONTHLY,
        startDate: new Date('2024-01-01')
      },
      {
        clientId: client1.id,
        type: EventType.INCOME,
        name: '13º salário',
        description: 'Décimo terceiro salário',
        value: 35000,
        frequency: Frequency.YEARLY,
        startDate: new Date('2024-12-01')
      }
    ]
  });

  // Create insurance for client1
  await prisma.insurance.createMany({
    data: [
      {
        clientId: client1.id,
        type: InsuranceType.LIFE,
        provider: 'Seguradora ABC',
        policyNumber: 'LIFE-123456',
        coverage: 2000000,
        premium: 500,
        premiumFrequency: Frequency.MONTHLY,
        startDate: new Date('2023-01-01')
      },
      {
        clientId: client1.id,
        type: InsuranceType.DISABILITY,
        provider: 'Seguradora XYZ',
        policyNumber: 'DIS-789012',
        coverage: 1500000,
        premium: 300,
        premiumFrequency: Frequency.MONTHLY,
        startDate: new Date('2023-06-01')
      }
    ]
  });

  // Create a simulation for client1
  const simulation = await prisma.simulation.create({
    data: {
      clientId: client1.id,
      name: 'Cenário Base - 4% a.a.',
      description: 'Projeção com taxa real de 4% ao ano',
      parameters: {
        initialWealth: 1500000,
        realRate: 0.04,
        monthlyContribution: 10000,
        retirementAge: 65
      },
      results: [
        { year: 2024, projectedValue: 1500000 },
        { year: 2025, projectedValue: 1680000 },
        { year: 2030, projectedValue: 2500000 },
        { year: 2035, projectedValue: 3500000 },
        { year: 2040, projectedValue: 4500000 },
        { year: 2044, projectedValue: 5200000 }
      ]
    }
  });

  console.log('Created simulation:', simulation);

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
