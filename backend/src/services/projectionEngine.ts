import { prisma } from '../prisma'

export interface WealthCurveParams {
  clientId: string
  initialWealth: number
  realRate: number
  startYear: number
  endYear: number
  includeEvents: boolean
}

export interface WealthCurveResult {
  year: number
  startValue: number
  endValue: number
  contribution: number
  withdrawal: number
  growth: number
  events: Array<{
    type: string
    value: number
    description: string
  }>
  totalGoalProgress: number
}

export async function simulateWealthCurve(params: WealthCurveParams): Promise<WealthCurveResult[]> {
  const { clientId, initialWealth, realRate, startYear, endYear, includeEvents } = params
  
  const currentYear = startYear
  const years = endYear - currentYear + 1
  const results: WealthCurveResult[] = []
  
  let currentWealth = initialWealth
  let accumulatedGoalProgress = 0

  const goals = await prisma.goal.findMany({
    where: { clientId },
    orderBy: { targetDate: 'asc' }
  })
  
  let events: any[] = []
  if (includeEvents) {
    events = await prisma.event.findMany({
      where: { clientId },
      orderBy: { startDate: 'asc' }
    })
  }
  
  for (let i = 0; i < years; i++) {
    const year = currentYear + i
    const startValue = currentWealth
    
    let yearContribution = 0
    let yearWithdrawal = 0
    let yearEvents: Array<{ type: string; value: number; description: string }> = []

    for (const goal of goals) {
      const yearsToTarget = new Date(goal.targetDate).getFullYear() - year
      const yearsFromStart = new Date(goal.targetDate).getFullYear() - startYear
      if (yearsToTarget > 0) {
        const progressThisYear = goal.targetValue / yearsFromStart
        accumulatedGoalProgress += progressThisYear
      }
    }
    
    if (includeEvents) {
      for (const event of events) {
        const eventStartYear = new Date(event.startDate).getFullYear()
        const eventEndYear = event.endDate ? new Date(event.endDate).getFullYear() : eventStartYear
        
        if (year >= eventStartYear && year <= eventEndYear) {
          let eventValue = event.value
          
          switch (event.frequency) {
            case 'MONTHLY':
              eventValue *= 12
              break
            case 'YEARLY':
              break
            case 'ONCE':
              if (year !== eventStartYear) {
                eventValue = 0
              }
              break
            default:
              break
          }
          
          if (event.type === 'DEPOSIT' || event.type === 'INCOME') {
            yearContribution += eventValue
            currentWealth += eventValue
          } else if (event.type === 'WITHDRAWAL' || event.type === 'EXPENSE') {
            yearWithdrawal += eventValue
            currentWealth -= eventValue
          }
          
          yearEvents.push({
            type: event.type,
            value: eventValue,
            description: event.description || ''
          })
        }
      }
    }
    
    const growth = currentWealth * realRate
    currentWealth += growth
    
    if (currentWealth < 0) {
      currentWealth = 0
    }
    
    results.push({
      year,
      startValue,
      endValue: currentWealth,
      contribution: yearContribution,
      withdrawal: yearWithdrawal,
      growth,
      events: yearEvents,
      totalGoalProgress: accumulatedGoalProgress
    })
  }
  
  return results
}

export function calculateRequiredContribution(
  currentWealth: number,
  targetWealth: number,
  years: number,
  annualRate: number
): number {
  if (currentWealth >= targetWealth) {
    return 0
  }
  
  if (years === 0) {
    return targetWealth - currentWealth
  }
  
  if (annualRate === 0) {
    return (targetWealth - currentWealth) / years
  }
  
  const futureValueOfCurrent = currentWealth * Math.pow(1 + annualRate, years)
  const annuityFactor = (Math.pow(1 + annualRate, years) - 1) / annualRate
  
  const requiredContribution = (targetWealth - futureValueOfCurrent) / annuityFactor
  
  return Math.max(0, requiredContribution)
}


