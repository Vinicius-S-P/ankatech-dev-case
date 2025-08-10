import { PrismaClient, Category, AssetType, InvestmentType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const currentDate = new Date();
  
  console.log('Seeding database...');

  await prisma.data.createMany({
    data: [
      {
        label: 'Plano Original',
        value: 879930,
        category: Category.PLANO_ORIGINAL,
        date: currentDate
      },
      {
        label: 'Situação Atual',
        value: 765000,
        category: Category.SITUACAO_ATUAL,
        date: currentDate
      },
      {
        label: 'Custo de Vida',
        value: 450000,
        category: Category.CUSTO_VIDA,
        date: currentDate
      }
    ]
  });

  await prisma.investment.createMany({
    data: [
      {
        name: 'Fundo DI',
        type: InvestmentType.FUNDO_DI,
        assetType: AssetType.FINANCEIRA,
        currentValue: 79930,
        initialValue: 55000,
        percentChange: 45.67,
        allocation: 8.5
      },
      {
        name: 'Fundo XXX',
        type: InvestmentType.FUNDO_MULTIMERCADO,
        assetType: AssetType.FINANCEIRA,
        currentValue: 359930,
        initialValue: 290000,
        percentChange: 23.89,
        allocation: 38.2
      },
      {
        name: 'BTC',
        type: InvestmentType.BTC,
        assetType: AssetType.FINANCEIRA,
        currentValue: 212879,
        initialValue: 120000,
        percentChange: 78.12,
        allocation: 22.6
      },
      {
        name: 'Casa de Praia',
        type: InvestmentType.CASA_PRAIA,
        assetType: AssetType.IMOBILIZADA,
        currentValue: 2500000,
        initialValue: 2000000,
        percentChange: 25.0,
        allocation: 26.5
      },
      {
        name: 'Apartamento SP',
        type: InvestmentType.APARTAMENTO,
        assetType: AssetType.IMOBILIZADA,
        currentValue: 1200000,
        initialValue: 1000000,
        percentChange: 20.0,
        allocation: 12.7
      }
    ]
  });

  await prisma.allocation.create({
    data: {
      totalAllocated: 879930,
      emergencyExpected: 100000,
      emergencyActual: 83000,
      date: currentDate
    }
  });

  await prisma.kPIData.createMany({
    data: [
      {
        category: 'Caixa',
        percentage: 14,
        indexer: null,
        custody: 'Caixa'
      },
      {
        category: 'Renda Fixa',
        percentage: 20,
        indexer: 'CDI',
        custody: 'XP'
      },
      {
        category: 'Previdência',
        percentage: 45,
        indexer: 'IPCA+',
        custody: 'Banco'
      },
      {
        category: 'Fundo de Investimentos',
        percentage: 21,
        indexer: 'Multi',
        custody: 'BTG'
      }
    ]
  });

  await prisma.goal.create({
    data: {
      retirementAge: 63,
      monthlyIncome: 20000,
      targetReturn: 'IPCA + 3,18%',
      currentProgress: 18,
      targetAmount: 100000,
      annualContribution: 0
    }
  });

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

