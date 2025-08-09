import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ProjectionEngine {
  async calculateProjection({
    clientId,
    initialValue,
    monthlyContribution,
    annualRate,
    years,
    inflationRate = 0.03,
    taxRate = 0.15,
    fees = 0.01
  }: {
    clientId: string;
    initialValue: number;
    monthlyContribution: number;
    annualRate: number;
    years: number;
    inflationRate?: number;
    taxRate?: number;
    fees?: number;
  }): Promise<{ year: number; projectedValue: number; realValue: number; afterTaxValue: number }[]> {
    const monthlyRate = annualRate / 12;
    const monthlyInflationRate = inflationRate / 12;
    const monthlyFees = fees / 12;
    const months = years * 12;
    
    let currentValue = initialValue;
    const projection = [];

    for (let i = 0; i < months; i++) {
      currentValue = (currentValue + monthlyContribution) * (1 + monthlyRate - monthlyFees);
      
      if ((i + 1) % 12 === 0) { // End of year calculations
        const year = (i + 1) / 12;
        const afterTaxValue = currentValue * (1 - taxRate);
        const realValue = afterTaxValue / Math.pow(1 + inflationRate, year);
        
        projection.push({
          year: year,
          projectedValue: currentValue,
          realValue: realValue,
          afterTaxValue: afterTaxValue
        });
      }
    }

    // Optionally save simulation results to DB
    await prisma.simulation.create({
      data: {
        clientId: clientId,
        name: `Projection for ${years} years`,
        parameters: {
          initialValue,
          monthlyContribution,
          annualRate,
          years,
          inflationRate,
          taxRate,
          fees
        },
        results: projection,
        version: 1,
        active: true
      }
    });

    return projection;
  }
}
