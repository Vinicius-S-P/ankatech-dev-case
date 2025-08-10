import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export enum Category {
  PLANO_ORIGINAL = 'PLANO_ORIGINAL',
  SITUACAO_ATUAL = 'SITUACAO_ATUAL',
  CUSTO_VIDA = 'CUSTO_VIDA'
}

export enum AssetType {
  FINANCEIRA = 'FINANCEIRA',
  IMOBILIZADA = 'IMOBILIZADA'
}

export enum InvestmentType {
  FUNDO_DI = 'FUNDO_DI',
  FUNDO_MULTIMERCADO = 'FUNDO_MULTIMERCADO',
  BTC = 'BTC',
  CASA_PRAIA = 'CASA_PRAIA',
  APARTAMENTO = 'APARTAMENTO',
  CAIXA = 'CAIXA',
  RENDA_FIXA = 'RENDA_FIXA',
  PREVIDENCIA = 'PREVIDENCIA',
  FUNDO_INVESTIMENTO = 'FUNDO_INVESTIMENTO',
  ALTERNATIVOS = 'ALTERNATIVOS'
}

export interface DataItem {
  id: string
  label: string
  value: number
  category: Category
  date: string
  createdAt: string
  updatedAt: string
}

export interface Investment {
  id: string
  name: string
  type: InvestmentType
  assetType: AssetType
  currentValue: number
  initialValue: number
  percentChange: number
  allocation: number
  date: string
  createdAt: string
  updatedAt: string
}

export interface Allocation {
  id: string
  totalAllocated: number
  emergencyExpected: number
  emergencyActual: number
  date: string
  createdAt: string
  updatedAt: string
}

export interface Goal {
  id: string
  retirementAge: number
  monthlyIncome: number
  targetReturn: string
  currentProgress: number
  targetAmount: number
  annualContribution: number
  date: string
  createdAt: string
  updatedAt: string
}

export interface KPIData {
  id: string
  category: string
  percentage: number
  indexer?: string
  custody?: string
  date: string
  createdAt: string
  updatedAt: string
}

export interface CreateDataInput {
  label: string
  value: number
  category: 'plano_original' | 'situacao_atual' | 'custo_vida'
  date?: string
}

export interface UpdateDataInput {
  label?: string
  value?: number
  category?: 'plano_original' | 'situacao_atual' | 'custo_vida'
  date?: string
}

export interface DataFilters {
  category?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface SummaryData {
  category: string
  total: number
  average: number
  min: number
  max: number
  count: number
}

export interface TimelineData {
  date: string
  plano_original: number
  situacao_atual: number
  custo_vida: number
}

export interface InvestmentSummary {
  totalValue: number
  count: number
  performance: {
    oneMonth: number
    threeMonths: number
    sixMonths: number
    oneYear: number
  }
}

export interface AssetTypeSummary {
  financial: InvestmentSummary
  realEstate: InvestmentSummary
  total: InvestmentSummary
}

export interface KPISummary {
  totalValue: number
  count: number
  averageReturn: number
  bestPerformer: string
  worstPerformer: string
}

export interface GroupedKPIData {
  [key: string]: {
    items: KPIData[]
    summary: KPISummary
  }
}

// API functions
export const dataApi = {
  create: (data: CreateDataInput) => 
    api.post<DataItem>('/api/data', data),
  
  findAll: (filters?: DataFilters) => 
    api.get<PaginatedResponse<DataItem>>('/api/data', { params: filters }),
  
  findById: (id: string) => 
    api.get<DataItem>(`/api/data/${id}`),
  
  update: (id: string, data: UpdateDataInput) => 
    api.put<DataItem>(`/api/data/${id}`, data),
  
  delete: (id: string) => 
    api.delete(`/api/data/${id}`),
  
  getSummary: (filters?: DataFilters) => 
    api.get<SummaryData[]>('/api/data/summary', { params: filters }),
  
  getByCategory: (filters?: DataFilters) => 
    api.get<Record<string, DataItem[]>>('/api/data/by-category', { params: filters }),
  
  getTimeline: (filters?: DataFilters) => 
    api.get<TimelineData[]>('/api/data/timeline', { params: filters }),
}

// Investment API
export const investmentApi = {
  create: (data: Partial<Investment>) => 
    api.post<Investment>('/api/investments', data),
  
  findAll: (params?: { assetType?: AssetType; type?: InvestmentType }) => 
    api.get<{ investments: Investment[], summary: InvestmentSummary }>('/api/investments', { params }),
  
  findById: (id: string) => 
    api.get<Investment>(`/api/investments/${id}`),
  
  update: (id: string, data: Partial<Investment>) => 
    api.put<Investment>(`/api/investments/${id}`, data),
  
  delete: (id: string) => 
    api.delete(`/api/investments/${id}`),
  
  getByAssetType: () => 
    api.get<AssetTypeSummary>('/api/investments/by-asset-type'),
}

// Allocation API
export const allocationApi = {
  create: (data: Partial<Allocation>) => 
    api.post<Allocation>('/api/allocations', data),
  
  getCurrent: () => 
    api.get<Allocation>('/api/allocations/current'),
  
  getHistory: (params?: { startDate?: string; endDate?: string; limit?: number }) => 
    api.get<Allocation[]>('/api/allocations/history', { params }),
  
  update: (id: string, data: Partial<Allocation>) => 
    api.put<Allocation>(`/api/allocations/${id}`, data),
  
  delete: (id: string) => 
    api.delete(`/api/allocations/${id}`),
}

// Goal API
export const goalApi = {
  create: (data: Partial<Goal>) => 
    api.post<Goal>('/api/goals', data),
  
  findAll: () => 
    api.get<Goal[]>('/api/goals'),
  
  getCurrent: () => 
    api.get<Goal & { monthsToRetirement: number; monthlyContribution: number; requiredMonthlyReturn: number; projectedValue: number }>('/api/goals/current'),
  
  findById: (id: string) => 
    api.get<Goal>(`/api/goals/${id}`),
  
  update: (id: string, data: Partial<Goal>) => 
    api.put<Goal>(`/api/goals/${id}`, data),
  
  delete: (id: string) => 
    api.delete(`/api/goals/${id}`),
}

// KPI API
export const kpiApi = {
  create: (data: Partial<KPIData>) => 
    api.post<KPIData>('/api/kpis', data),
  
  findAll: (params?: { category?: string; indexer?: string; custody?: string }) => 
    api.get<{ kpis: KPIData[], summary: KPISummary }>('/api/kpis', { params }),
  
  findById: (id: string) => 
    api.get<KPIData>(`/api/kpis/${id}`),
  
  update: (id: string, data: Partial<KPIData>) => 
    api.put<KPIData>(`/api/kpis/${id}`, data),
  
  delete: (id: string) => 
    api.delete(`/api/kpis/${id}`),
  
  getByGroup: (groupBy: 'category' | 'indexer' | 'custody' = 'category') => 
    api.get<GroupedKPIData>('/api/kpis/grouped', { params: { groupBy } }),
}
