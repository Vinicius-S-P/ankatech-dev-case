"use client"

import { useState, useEffect } from 'react'
import { 
  investmentApi, 
  allocationApi, 
  goalApi, 
  kpiApi,
  Investment,
  Allocation,
  Goal,
  KPIData 
} from '@/lib/api'

interface FinancialData {
  investments: {
    financial: Investment[]
    realEstate: Investment[]
    total: {
      value: number
      count: number
    }
  }
  allocation: Allocation | null
  goal: Goal & { 
    monthsToRetirement: number
    monthlyContribution: number
    requiredMonthlyReturn: number
    projectedValue: number
  } | null
  kpis: KPIData[]
}

export function useFinancialData() {
  const [data, setData] = useState<FinancialData>({
    investments: {
      financial: [],
      realEstate: [],
      total: { value: 0, count: 0 }
    },
    allocation: null,
    goal: null,
    kpis: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [investmentData, allocationData, goalData, kpiData] = await Promise.all([
        investmentApi.getByAssetType(),
        allocationApi.getCurrent(),
        goalApi.getCurrent(),
        kpiApi.findAll()
      ])

      setData({
        investments: {
          financial: (investmentData.data as any).financial?.assets || [],
          realEstate: (investmentData.data as any).realEstate?.assets || [],
          total: { value: (investmentData.data as any).total?.totalValue || 0, count: (investmentData.data as any).total?.count || 0 }
        },
        allocation: allocationData.data,
        goal: goalData.data,
        kpis: kpiData.data.kpis
      })
    } catch (err) {
      console.error('Error fetching financial data:', err)
      setError('Failed to load financial data')
    } finally {
      setLoading(false)
    }
  }

  const refresh = () => {
    fetchData()
  }

  return { data, loading, error, refresh }
}
