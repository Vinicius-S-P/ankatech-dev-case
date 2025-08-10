import { prisma } from '../prisma'

export interface WealthCurveParams {
  clientId: string
  initialWealth: number
  realRate: number
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
}

export async function simulateWealthCurve(params: WealthCurveParams): Promise<WealthCurveResult[]> {
  const { clientId, initialWealth, realRate, endYear, includeEvents } = params
  
  const currentYear = new Date().getFullYear()
  const years = endYear - currentYear + 1
  const results: WealthCurveResult[] = []
  
  let currentWealth = initialWealth
  
  // Get client events if needed
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
    
    // Process events for this year
    if (includeEvents) {
      for (const event of events) {
        const eventStartYear = new Date(event.startDate).getFullYear()
        const eventEndYear = event.endDate ? new Date(event.endDate).getFullYear() : eventStartYear
        
        if (year >= eventStartYear && year <= eventEndYear) {
          let eventValue = event.value
          
          // Calculate frequency multiplier
          switch (event.frequency) {
            case 'MONTHLY':
              eventValue *= 12
              break
            case 'QUARTERLY':
              eventValue *= 4
              break
            case 'SEMI_ANNUAL':
              eventValue *= 2
              break
            case 'ANNUAL':
            default:
              // eventValue already correct
              break
          }
          
          if (event.type === 'CONTRIBUTION') {
            yearContribution += eventValue
            currentWealth += eventValue
          } else if (event.type === 'WITHDRAWAL') {
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
    
    // Apply growth
    const growth = currentWealth * realRate
    currentWealth += growth
    
    // Ensure no negative wealth
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
      events: yearEvents
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
  // If already at or above target, no contribution needed
  if (currentWealth >= targetWealth) {
    return 0
  }
  
  // If zero years, need to contribute the full gap immediately
  if (years === 0) {
    return targetWealth - currentWealth
  }
  
  // If zero rate, simple division
  if (annualRate === 0) {
    return (targetWealth - currentWealth) / years
  }
  
  // Calculate using PMT formula
  // FV = PV * (1 + r)^n + PMT * [((1 + r)^n - 1) / r]
  // Solving for PMT:
  // PMT = (FV - PV * (1 + r)^n) / [((1 + r)^n - 1) / r]
  
  const futureValueOfCurrent = currentWealth * Math.pow(1 + annualRate, years)
  const annuityFactor = (Math.pow(1 + annualRate, years) - 1) / annualRate
  
  const requiredContribution = (targetWealth - futureValueOfCurrent) / annuityFactor
  
  return Math.max(0, requiredContribution)
}

export function calculateAlignmentPercentage(
  currentWealth: number,
  targetWealth: number,
  yearsToTarget: number,
  currentContribution: number,
  realRate: number
): number {
  if (targetWealth <= 0) return 100
  
  // Calculate projected wealth with current contributions
  const projectedWealth = simulateProjectedWealth(
    currentWealth,
    currentContribution,
    yearsToTarget,
    realRate
  )
  
  // Alignment is percentage of target achieved
  const alignment = (projectedWealth / targetWealth) * 100
  
  return Math.min(100, Math.max(0, alignment))
}

function simulateProjectedWealth(
  initialWealth: number,
  annualContribution: number,
  years: number,
  annualRate: number
): number {
  let wealth = initialWealth
  
  for (let i = 0; i < years; i++) {
    wealth = wealth * (1 + annualRate) + annualContribution
  }
  
  return wealth
}
