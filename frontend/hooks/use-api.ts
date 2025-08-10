import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useClientOnly } from '@/hooks/use-client-only'
import { 
  authAPI, 
  clientsAPI, 
  goalsAPI, 
  walletsAPI, 
  eventsAPI, 
  simulationsAPI, 
  projectionsAPI, 
  insuranceAPI 
} from '@/lib/api-client'

// Auth Hooks
export const useAuth = () => {
  const queryClient = useQueryClient()
  const isClient = useClientOnly()

  const loginMutation = useMutation({
    mutationFn: authAPI.login,
    onSuccess: (data) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('authToken', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
      }
      queryClient.invalidateQueries({ queryKey: ['auth'] })
      toast.success('Login realizado com sucesso!')
    },
    onError: () => {
      toast.error('Erro no login. Verifique suas credenciais.')
    },
  })

  const registerMutation = useMutation({
    mutationFn: authAPI.register,
    onSuccess: () => {
      toast.success('Usuário criado com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao criar usuário.')
    },
  })

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
      queryClient.clear()
      window.location.href = '/login'
      toast.success('Logout realizado com sucesso!')
    }
  }

  const isAuthenticated = () => {
    // Durante SSR ou antes da hidratação, não podemos verificar autenticação
    if (typeof window === 'undefined') return false
    
    // No cliente, verificar diretamente o localStorage
    try {
      return !!localStorage.getItem('authToken')
    } catch {
      return false
    }
  }

  const getUser = () => {
    if (!isClient || typeof window === 'undefined') return null
    try {
      const user = localStorage.getItem('user')
      return user ? JSON.parse(user) : null
    } catch {
      return null
    }
  }

  return {
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    isAuthenticated,
    getUser,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
  }
}

// Clients Hooks
export const useClients = (page?: number, limit?: number, search?: string) => {
  return useQuery({
    queryKey: ['clients', page, limit, search],
    queryFn: async () => {
      console.log('Fazendo requisição para buscar clientes:', { page, limit, search })
      const result = await clientsAPI.getAll(page, limit, search)
      console.log('Resultado da API de clientes:', result)
      return result
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: 1000,

  })
}

export const useClient = (id: string) => {
  return useQuery({
    queryKey: ['client', id],
    queryFn: () => clientsAPI.getById(id),
    enabled: !!id,
  })
}

export const useCreateClient = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: clientsAPI.create,
    onSuccess: (data) => {
      console.log('Cliente criado com sucesso:', data)
      // Invalidar todas as queries de clientes
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      // Refetch forçado para garantir que os dados sejam atualizados
      queryClient.refetchQueries({ queryKey: ['clients'] })
      toast.success('Cliente criado com sucesso!')
    },
    onError: (error) => {
      console.error('Erro ao criar cliente:', error)
      toast.error('Erro ao criar cliente.')
    },
  })
}

export const useUpdateClient = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => clientsAPI.update(id, data),
    onSuccess: (data, variables) => {
      console.log('Cliente atualizado com sucesso:', data)
      // Invalidar e refetch queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['client', variables.id] })
      queryClient.refetchQueries({ queryKey: ['clients'] })
      toast.success('Cliente atualizado com sucesso!')
    },
    onError: (error) => {
      console.error('Erro ao atualizar cliente:', error)
      toast.error('Erro ao atualizar cliente.')
    },
  })
}

export const useDeleteClient = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: clientsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      toast.success('Cliente removido com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao remover cliente.')
    },
  })
}

export const useClientAlignment = (id: string) => {
  return useQuery({
    queryKey: ['client-alignment', id],
    queryFn: () => clientsAPI.getAlignment(id),
    enabled: !!id,
  })
}

export const useClientSuggestions = (id: string) => {
  return useQuery({
    queryKey: ['client-suggestions', id],
    queryFn: () => clientsAPI.getSuggestions(id),
    enabled: !!id,
  })
}

// Goals Hooks
export const useGoals = (clientId?: string) => {
  return useQuery({
    queryKey: ['goals', clientId],
    queryFn: () => goalsAPI.getAll(clientId),
    staleTime: 5 * 60 * 1000,
  })
}

export const useGoal = (id: string) => {
  return useQuery({
    queryKey: ['goal', id],
    queryFn: () => goalsAPI.getById(id),
    enabled: !!id,
  })
}

export const useCreateGoal = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: goalsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      toast.success('Meta criada com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao criar meta.')
    },
  })
}

export const useUpdateGoal = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => goalsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      queryClient.invalidateQueries({ queryKey: ['goal'] })
      toast.success('Meta atualizada com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao atualizar meta.')
    },
  })
}

export const useDeleteGoal = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: goalsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      toast.success('Meta removida com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao remover meta.')
    },
  })
}

// Wallets Hooks
export const useWallets = (clientId?: string, page?: number, limit?: number, search?: string) => {
  return useQuery({
    queryKey: ['wallets', clientId, page, limit, search],
    queryFn: () => walletsAPI.getAll(clientId),
    staleTime: 5 * 60 * 1000,
  })
}

export const useWallet = (id: string) => {
  return useQuery({
    queryKey: ['wallet', id],
    queryFn: () => walletsAPI.getById(id),
    enabled: !!id,
  })
}

export const useCreateWallet = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: walletsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
      toast.success('Carteira criada com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao criar carteira.')
    },
  })
}

export const useUpdateWallet = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => walletsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
      toast.success('Carteira atualizada com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao atualizar carteira.')
    },
  })
}

export const useDeleteWallet = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: walletsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
      toast.success('Carteira removida com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao remover carteira.')
    },
  })
}

export const useWalletRebalancing = (clientId: string) => {
  return useQuery({
    queryKey: ['wallet-rebalancing', clientId],
    queryFn: () => walletsAPI.getRebalancing(clientId),
    enabled: !!clientId,
  })
}

export const useRebalancePortfolio = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ clientId, targetAllocations }: { clientId: string; targetAllocations: Record<string, number> }) =>
      walletsAPI.getRebalancing(clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
      toast.success('Rebalanceamento executado com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao executar rebalanceamento.')
    },
  })
}

// Events Hooks
export const useEvents = (clientId?: string) => {
  return useQuery({
    queryKey: ['events', clientId],
    queryFn: () => eventsAPI.getAll(clientId),
    staleTime: 5 * 60 * 1000,
  })
}

export const useEvent = (id: string) => {
  return useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsAPI.getById(id),
    enabled: !!id,
  })
}

export const useCreateEvent = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: eventsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      toast.success('Evento criado com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao criar evento.')
    },
  })
}

export const useUpdateEvent = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => eventsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['event'] })
      toast.success('Evento atualizado com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao atualizar evento.')
    },
  })
}

export const useDeleteEvent = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: eventsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      toast.success('Evento removido com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao remover evento.')
    },
  })
}

// Simulations Hooks
export const useSimulations = (clientId?: string) => {
  return useQuery({
    queryKey: ['simulations', clientId],
    queryFn: () => simulationsAPI.getAll(clientId),
    staleTime: 5 * 60 * 1000,
  })
}

export const useSimulation = (id: string) => {
  return useQuery({
    queryKey: ['simulation', id],
    queryFn: () => simulationsAPI.getById(id),
    enabled: !!id,
  })
}

export const useCreateSimulation = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: simulationsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulations'] })
      toast.success('Simulação criada com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao criar simulação.')
    },
  })
}

export const useUpdateSimulation = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => simulationsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulations'] })
      queryClient.invalidateQueries({ queryKey: ['simulation'] })
      toast.success('Simulação atualizada com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao atualizar simulação.')
    },
  })
}

export const useDeleteSimulation = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: simulationsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulations'] })
      toast.success('Simulação removida com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao remover simulação.')
    },
  })
}

// Projections Hooks
export const useWealthProjection = () => {
  return useMutation({
    mutationFn: projectionsAPI.simulate,
    onSuccess: () => {
      toast.success('Projeção calculada com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao calcular projeção.')
    },
  })
}

export const useWealthCurve = () => {
  return useMutation({
    mutationFn: ({ clientId, params }: { clientId: string; params: Record<string, unknown> }) => 
      projectionsAPI.getWealthCurve(clientId, params as any),
    onSuccess: () => {
      toast.success('Curva de patrimônio calculada com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao calcular curva de patrimônio.')
    },
  })
}

// Insurance Hooks
export const useInsurance = (page?: number, limit?: number, search?: string) => {
  return useQuery({
    queryKey: ['insurance', page, limit, search],
    queryFn: () => insuranceAPI.getAll(), // Note: sem clientId pois o componente não parece estar passando
    staleTime: 5 * 60 * 1000,
  })
}

export const useInsurancePolicy = (id: string) => {
  return useQuery({
    queryKey: ['insurance-policy', id],
    queryFn: () => insuranceAPI.getById(id),
    enabled: !!id,
  })
}

export const useCreateInsurance = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: insuranceAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance'] })
      toast.success('Seguro criado com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao criar seguro.')
    },
  })
}

export const useUpdateInsurance = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => insuranceAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance'] })
      queryClient.invalidateQueries({ queryKey: ['insurance-policy'] })
      toast.success('Seguro atualizado com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao atualizar seguro.')
    },
  })
}

export const useDeleteInsurance = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: insuranceAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance'] })
      toast.success('Seguro removido com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao remover seguro.')
    },
  })
}
