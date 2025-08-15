import { prisma } from '../prisma'

export interface Suggestion {
  id: string
  type: 'CONTRIBUTION_INCREASE' | 'REBALANCING' | 'GOAL_ADJUSTMENT' | 'RISK_ANALYSIS' | 'TAX_OPTIMIZATION'
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  title: string
  description: string
  impact: string
  actionRequired: {
    amount?: number
    duration?: number
    frequency?: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'
    percentage?: number
    action?: string
  }
  reasoning: string
  potentialGain: number
  confidence: number
}

export async function generateSuggestions(clientId: string): Promise<Suggestion[]> {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: { 
      goals: {
        orderBy: { targetDate: 'asc' }
      }, 
      wallets: true,
      events: true,
      insurance: true
    }
  })

  if (!client) {
    throw new Error('Cliente não encontrado')
  }

  const suggestions: Suggestion[] = []

  // 1. Análise de carteira e rebalanceamento
  await analyzePortfolio(client, suggestions)

  // 2. Análise de metas
  await analyzeGoals(client, suggestions)

  // 3. Análise de risco
  await analyzeRisk(client, suggestions)

  // 4. Otimização fiscal
  await analyzeTaxOptimization(client, suggestions)

  // Ordenar por prioridade e confiança
  return suggestions.sort((a, b) => {
    const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 }
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    }
    return b.confidence - a.confidence
  })
}



async function analyzePortfolio(client: any, suggestions: Suggestion[]) {
  const wallets = client.wallets || []
  
  if (wallets.length === 0) {
    return
  }

  const totalValue = wallets.reduce((sum: number, w: any) => sum + w.currentValue, 0)
  const assetAllocation = wallets.reduce((acc: any, wallet: any) => {
    acc[wallet.assetClass] = (acc[wallet.assetClass] || 0) + (wallet.currentValue / totalValue * 100)
    return acc
  }, {})

  // Verificar se há concentração excessiva
  const maxAllocation = Math.max(...Object.values(assetAllocation) as number[])
  if (maxAllocation > 60) {
    const concentratedAsset = Object.keys(assetAllocation).find(
      key => assetAllocation[key] === maxAllocation
    )

    suggestions.push({
      id: `rebalancing_${client.id}`,
      type: 'REBALANCING',
      priority: maxAllocation > 80 ? 'HIGH' : 'MEDIUM',
      title: 'Rebalanceamento de Carteira Necessário',
      description: `Concentração excessiva em ${getAssetClassName(concentratedAsset)} (${maxAllocation.toFixed(1)}%)`,
      impact: `Reduzir risco através de melhor diversificação`,
      actionRequired: {
        percentage: Math.round(maxAllocation - 50),
        action: `Redistribuir ${(maxAllocation - 50).toFixed(1)}% para outras classes de ativos`
      },
      reasoning: `Uma concentração de ${maxAllocation.toFixed(1)}% em uma única classe de ativos aumenta significativamente o risco da carteira. O ideal seria manter entre 30-50% em cada classe principal.`,
      potentialGain: totalValue * 0.02, // Assumindo 2% de melhoria no retorno ajustado ao risco
      confidence: 75
    })
  }

  // Verificar se há ativos de baixa performance
  const cashPercentage = assetAllocation['CASH'] || 0
  if (cashPercentage > 15) {
    suggestions.push({
      id: `cash_optimization_${client.id}`,
      type: 'TAX_OPTIMIZATION',
      priority: 'MEDIUM',
      title: 'Excesso de Caixa Identificado',
      description: `${cashPercentage.toFixed(1)}% da carteira em caixa/equivalentes`,
      impact: `Potencial aumento de ${(cashPercentage * 0.05).toFixed(1)}% no retorno anual`,
      actionRequired: {
        percentage: Math.round(cashPercentage - 10),
        action: 'Investir excesso de caixa em ativos com maior potencial de retorno'
      },
      reasoning: `Manter mais de 15% em caixa pode resultar em perda de oportunidade de crescimento, especialmente em períodos de inflação.`,
      potentialGain: totalValue * (cashPercentage - 10) / 100 * 0.05,
      confidence: 70
    })
  }
}

async function analyzeGoals(client: any, suggestions: Suggestion[]) {
  const goals = client.goals || []

  for (const goal of goals) {
    const yearsToTarget = Math.ceil(
      (new Date(goal.targetDate).getTime() - new Date().getTime()) / 
      (1000 * 60 * 60 * 24 * 365)
    )

    const currentProgress = (goal.currentAmount / goal.targetAmount) * 100

    // Meta muito ambiciosa
    if (yearsToTarget < 5 && currentProgress < 30) {
      suggestions.push({
        id: `goal_adjustment_${goal.id}`,
        type: 'GOAL_ADJUSTMENT',
        priority: 'MEDIUM',
        title: `Revisão da Meta: ${goal.title}`,
        description: `Meta pode ser muito ambiciosa (${currentProgress.toFixed(1)}% concluída, ${yearsToTarget} anos restantes)`,
        impact: `Considerar ajustar valor ou prazo para maior viabilidade`,
        actionRequired: {
          action: `Revisar meta: reduzir valor em 30% OU estender prazo em 3 anos`
        },
        reasoning: `Com apenas ${currentProgress.toFixed(1)}% da meta alcançada e ${yearsToTarget} anos restantes, seria necessário um esforço financeiro muito alto para atingir o objetivo.`,
        potentialGain: 0,
        confidence: 60
      })
    }

    // Meta muito conservadora
    if (yearsToTarget > 15 && currentProgress > 80) {
      suggestions.push({
        id: `goal_expansion_${goal.id}`,
        type: 'GOAL_ADJUSTMENT',
        priority: 'LOW',
        title: `Oportunidade de Expansão: ${goal.title}`,
        description: `Meta está bem encaminhada (${currentProgress.toFixed(1)}% concluída)`,
        impact: `Considerar aumentar meta em 50% para maior crescimento`,
        actionRequired: {
          amount: Math.round(goal.targetAmount * 0.5),
          action: 'Aumentar valor da meta aproveitando boa situação atual'
        },
        reasoning: `Com ${currentProgress.toFixed(1)}% já alcançado e ${yearsToTarget} anos pela frente, há espaço para metas mais ambiciosas.`,
        potentialGain: goal.targetAmount * 0.5,
        confidence: 55
      })
    }
  }
}

async function analyzeRisk(client: any, suggestions: Suggestion[]) {
  const insurance = client.insurance || []
  const totalWealth = client.totalWealth || 0

  // Verificar cobertura de seguro
  const totalCoverage = insurance.reduce((sum: number, ins: any) => sum + (ins.coverage || 0), 0)
  const coverageRatio = totalWealth > 0 ? totalCoverage / totalWealth : 0

  if (coverageRatio < 3 && client.age < 60) {
    suggestions.push({
      id: `insurance_${client.id}`,
      type: 'RISK_ANALYSIS',
      priority: 'MEDIUM',
      title: 'Cobertura de Seguro Insuficiente',
      description: `Cobertura atual representa apenas ${(coverageRatio * 100).toFixed(1)}% do patrimônio`,
      impact: `Proteger família em caso de imprevistos`,
      actionRequired: {
        amount: Math.round(totalWealth * 3 - totalCoverage),
        action: 'Aumentar cobertura de seguro de vida'
      },
      reasoning: `É recomendado manter cobertura de seguro de vida entre 3-5x o patrimônio líquido, especialmente para pessoas abaixo de 60 anos com dependentes.`,
      potentialGain: 0, // Seguro é proteção, não retorno
      confidence: 80
    })
  }
}

async function analyzeTaxOptimization(client: any, suggestions: Suggestion[]) {
  const wallets = client.wallets || []
  const hasPrivatePension = wallets.some((w: any) => w.description?.toLowerCase().includes('previdência'))

  if (!hasPrivatePension && client.age < 50) {
    const totalWealth = client.totalWealth || 0
    const suggestedAmount = Math.min(totalWealth * 0.1, 100000) // 10% ou R$ 100k, o que for menor

    suggestions.push({
      id: `tax_optimization_${client.id}`,
      type: 'TAX_OPTIMIZATION',
      priority: 'LOW',
      title: 'Otimização Fiscal com Previdência',
      description: 'Não identificamos investimentos em previdência privada',
      impact: `Economia fiscal de até ${(suggestedAmount * 0.275).toFixed(0)} por ano`,
      actionRequired: {
        amount: Math.round(suggestedAmount),
        action: 'Considerar aportes em PGBL para dedução no IR'
      },
      reasoning: `Investimentos em PGBL permitem dedução de até 12% da renda bruta anual no Imposto de Renda, oferecendo vantagem fiscal significativa.`,
      potentialGain: suggestedAmount * 0.275, // 27.5% de alíquota máxima
      confidence: 65
    })
  }
}

function getAssetClassName(assetClass: string | undefined): string {
  const names: Record<string, string> = {
    'STOCKS': 'Ações',
    'BONDS': 'Títulos',
    'REAL_ESTATE': 'Fundos Imobiliários',
    'COMMODITIES': 'Commodities',
    'CASH': 'Caixa',
    'CRYPTO': 'Criptomoedas',
    'PRIVATE_EQUITY': 'Private Equity',
    'OTHER': 'Outros'
  }
  
  return names[assetClass || ''] || 'Não identificado'
}
