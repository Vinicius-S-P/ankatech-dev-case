import axios from 'axios'
import { toast } from 'sonner'

// Type definitions
interface ClientCreateData {
  name: string
  email: string
  age: number
  familyProfile?: string
}

interface GoalCreateData {
  clientId: string
  type: string
  name: string
  description?: string
  targetValue: number
  targetDate: string
  currentValue?: number
  monthlyIncome?: number
  priority?: string
}

interface WalletCreateData {
  clientId: string
  assetClass: string
  percentage: number
  currentValue: number
  description?: string
  targetPercentage?: number
  assetType?: string
  symbol?: string
  quantity?: number
  averagePrice?: number
}

interface EventCreateData {
  clientId: string
  type: string
  name: string
  description?: string
  value: number
  frequency: string
  startDate: string
  endDate?: string
}

interface SimulationCreateData {
  clientId: string
  name: string
  description?: string
  parameters: Record<string, unknown>
}

interface InsuranceCreateData {
  clientId: string
  type: string
  provider: string
  policyNumber?: string
  policyType?: string
  coverage: number
  premium: number
  premiumFrequency: string
  startDate: string
  endDate?: string
}

interface UserRegistrationData {
  name: string
  email: string
  password: string
  role?: string
}

interface ProjectionData {
  clientId: string
  parameters: Record<string, unknown>
  timeHorizon?: number
  initialValue?: number
}

interface WealthCurveParams {
  startDate: string
  endDate: string
  monthlyContribution?: number
  annualReturn?: number
}

type UpdateData = Partial<ClientCreateData & GoalCreateData & WalletCreateData & EventCreateData & SimulationCreateData & InsuranceCreateData>

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Erro inesperado'
    
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken')
        localStorage.removeItem('user')
        
        // Só redirecionar se não estivermos já na página de login
        const currentPath = window.location.pathname
        if (currentPath !== '/login') {
          window.location.href = '/login'
          toast.error('Sessão expirada. Faça login novamente.')
        }
      }
    } else if (error.response?.status >= 400) {
      toast.error(message)
    }
    
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: async (credentials: { email: string; password: string }) => {
    const response = await apiClient.post('/api/auth/login', credentials)
    return response.data
  },
  
  register: async (userData: UserRegistrationData) => {
    const response = await apiClient.post('/api/auth/register', userData)
    return response.data
  },
  
  verify: async () => {
    const response = await apiClient.get('/api/auth/verify')
    return response.data
  },
}

// Clients API
export const clientsAPI = {
  getAll: async (page?: number, limit?: number, search?: string) => {
    const params = new URLSearchParams()
    if (page) params.append('page', page.toString())
    if (limit) params.append('limit', limit.toString())
    if (search) params.append('search', search)
    
    const response = await apiClient.get(`/api/clients?${params}`)
    return response.data
  },
  
  getById: async (id: string) => {
    const response = await apiClient.get(`/api/clients/${id}`)
    return response.data
  },
  
  create: async (clientData: ClientCreateData) => {
    const response = await apiClient.post('/api/clients', clientData)
    return response.data
  },
  
  update: async (id: string, clientData: UpdateData) => {
    const response = await apiClient.put(`/api/clients/${id}`, clientData)
    return response.data
  },
  
  delete: async (id: string) => {
    const response = await apiClient.delete(`/api/clients/${id}`)
    return response.data
  },
  
  getAlignment: async (id: string) => {
    const response = await apiClient.get(`/api/clients/${id}/alignment`)
    return response.data
  },
  
  getSuggestions: async (id: string) => {
    const response = await apiClient.get(`/api/clients/${id}/suggestions`)
    return response.data
  },
}

// Goals API
export const goalsAPI = {
  getAll: async (clientId?: string) => {
    const params = clientId ? `?clientId=${clientId}` : ''
    const response = await apiClient.get(`/api/goals${params}`)
    return response.data
  },
  
  getById: async (id: string) => {
    const response = await apiClient.get(`/api/goals/${id}`)
    return response.data
  },
  
  create: async (goalData: GoalCreateData) => {
    const response = await apiClient.post('/api/goals', goalData)
    return response.data
  },
  
  update: async (id: string, goalData: UpdateData) => {
    const response = await apiClient.put(`/api/goals/${id}`, goalData)
    return response.data
  },
  
  delete: async (id: string) => {
    const response = await apiClient.delete(`/api/goals/${id}`)
    return response.data
  },
}

// Wallets API
export const walletsAPI = {
  getAll: async (clientId?: string) => {
    const params = clientId ? `?clientId=${clientId}` : ''
    const response = await apiClient.get(`/api/wallets${params}`)
    return response.data
  },
  
  getById: async (id: string) => {
    const response = await apiClient.get(`/api/wallets/${id}`)
    return response.data
  },
  
  create: async (walletData: WalletCreateData) => {
    const response = await apiClient.post('/api/wallets', walletData)
    return response.data
  },
  
  update: async (id: string, walletData: UpdateData) => {
    const response = await apiClient.put(`/api/wallets/${id}`, walletData)
    return response.data
  },
  
  delete: async (id: string) => {
    const response = await apiClient.delete(`/api/wallets/${id}`)
    return response.data
  },
  
  getRebalancing: async (clientId: string) => {
    const response = await apiClient.get(`/api/wallets/rebalancing/${clientId}`)
    return response.data
  },
}

// Events API
export const eventsAPI = {
  getAll: async (clientId?: string) => {
    const params = clientId ? `?clientId=${clientId}` : ''
    const response = await apiClient.get(`/api/events${params}`)
    return response.data
  },
  
  getById: async (id: string) => {
    const response = await apiClient.get(`/api/events/${id}`)
    return response.data
  },
  
  create: async (eventData: EventCreateData) => {
    const response = await apiClient.post('/api/events', eventData)
    return response.data
  },
  
  update: async (id: string, eventData: UpdateData) => {
    const response = await apiClient.put(`/api/events/${id}`, eventData)
    return response.data
  },
  
  delete: async (id: string) => {
    const response = await apiClient.delete(`/api/events/${id}`)
    return response.data
  },
}

// Simulations API
export const simulationsAPI = {
  getAll: async (clientId?: string) => {
    const params = clientId ? `?clientId=${clientId}` : ''
    const response = await apiClient.get(`/api/simulations${params}`)
    return response.data
  },
  
  getById: async (id: string) => {
    const response = await apiClient.get(`/api/simulations/${id}`)
    return response.data
  },
  
  create: async (simulationData: SimulationCreateData) => {
    const response = await apiClient.post('/api/simulations', simulationData)
    return response.data
  },
  
  update: async (id: string, simulationData: UpdateData) => {
    const response = await apiClient.put(`/api/simulations/${id}`, simulationData)
    return response.data
  },
  
  delete: async (id: string) => {
    const response = await apiClient.delete(`/api/simulations/${id}`)
    return response.data
  },
}

// Projections API
export const projectionsAPI = {
  simulate: async (projectionData: ProjectionData) => {
    const response = await apiClient.post('/api/projections/simulate', projectionData)
    return response.data
  },
  
  getWealthCurve: async (clientId: string, params: WealthCurveParams) => {
    const response = await apiClient.post(`/api/projections/wealth-curve/${clientId}`, params)
    return response.data
  },
}

// Insurance API
export const insuranceAPI = {
  getAll: async (clientId?: string) => {
    const params = clientId ? `?clientId=${clientId}` : ''
    const response = await apiClient.get(`/api/insurance${params}`)
    return response.data
  },
  
  getById: async (id: string) => {
    const response = await apiClient.get(`/api/insurance/${id}`)
    return response.data
  },
  
  create: async (insuranceData: InsuranceCreateData) => {
    const response = await apiClient.post('/api/insurance', insuranceData)
    return response.data
  },
  
  update: async (id: string, insuranceData: UpdateData) => {
    const response = await apiClient.put(`/api/insurance/${id}`, insuranceData)
    return response.data
  },
  
  delete: async (id: string) => {
    const response = await apiClient.delete(`/api/insurance/${id}`)
    return response.data
  },
}
