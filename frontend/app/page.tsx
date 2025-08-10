"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ClientOnly } from "@/components/client-only"
import { useClients, useGoals, useAuth } from "@/hooks/use-api"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  PieChart, 
  Wallet,
  ArrowUpRight,

  Users,
  Calculator,
  Shield,
  AlertTriangle,
  Calendar,
  Home,
  BarChart3
} from "lucide-react"

interface Client {
  id: string
  name: string
  email: string
  age: number
  totalWealth?: number
  alignmentPercentage?: number
  alignmentCategory?: string
  active: boolean
  advisorId?: string
  familyProfile?: string
  createdAt: string
  updatedAt: string
}

interface Goal {
  id: string
  name: string
  description?: string
  type: string
  clientId: string
  targetValue: number
  currentValue?: number
  targetDate: string
  createdAt: string
  updatedAt: string
}

interface ClientsResponse {
  clients: Client[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function Dashboard() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'dashboard' | 'reports'>('dashboard')
  const { getUser } = useAuth()
  const { data: clientsData, isLoading: clientsLoading, error: clientsError } = useClients(1, 100)
  const { data: goalsData, isLoading: goalsLoading, error: goalsError } = useGoals()
  
  // Initialize view mode from URL params
  useEffect(() => {
    const view = searchParams.get('view')
    if (view === 'reports') {
      setViewMode('reports')
    }
  }, [searchParams])

  // Mock data para demonstração caso as APIs não estejam disponíveis
  const useMockData = clientsError || goalsError
  
  const clients = (clientsData as ClientsResponse)?.clients || []
  const goals = goalsData?.data || []
  const user = getUser()

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const getAlignmentStats = () => {
    if (clients.length === 0) {
      return { total: 0, average: 0, lowAlignment: 0 }
    }

    const total = clients.length
    const average = clients.reduce((sum: number, client: Client) => sum + (client.alignmentPercentage || 0), 0) / total
    const lowAlignment = clients.filter((c: Client) => (c.alignmentPercentage || 0) < 70).length

    return { total, average, lowAlignment }
  }

  const getTotalWealth = () => {
    return clients.reduce((sum: number, client: Client) => sum + (client.totalWealth || 0), 0)
  }

  const getGoalsStats = () => {
    if (goals.length === 0) {
      return { total: 0, nearTarget: 0 }
    }

    const total = goals.length
    const nearTarget = goals.filter((goal: Goal) => {
      const targetDate = new Date(goal.targetDate)
      const now = new Date()
      const diffTime = targetDate.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays <= 90 && diffDays > 0
    }).length

    return { total, nearTarget }
  }

  const stats = getAlignmentStats()
  const totalWealth = getTotalWealth()
  const goalsStats = getGoalsStats()

  return (
      <div className="flex min-h-screen w-full flex-col">
        <div className="flex flex-col sm:gap-4 sm:py-4">
          {/* Header com informações do usuário */}
          <ClientOnly fallback={
          <div className="px-4 mb-4">
            <Alert>
              <Users className="h-4 w-4" />
              <AlertDescription>
                Carregando informações do usuário...
              </AlertDescription>
            </Alert>
          </div>
        }>
          {user && (
            <div className="px-4 mb-4">
              <Alert>
                <Users className="h-4 w-4" />
                <AlertDescription>
                  Bem-vindo, <strong>{user.name}</strong>! Você está logado como <Badge variant="outline">{user.role}</Badge>
                  {useMockData && (
                    <span className="text-yellow-600 ml-2">
                      (Demonstração com dados simulados - backend indisponível)
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            </div>
          )}
        </ClientOnly>

        {/* View Mode Selector */}
        <div className="px-4 mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'dashboard' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('dashboard')}
            >
              <Home className="h-4 w-4 mr-2" />
              Dashboard Principal
            </Button>
            <Button
              variant={viewMode === 'reports' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('reports')}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Relatórios Avançados
            </Button>
          </div>
        </div>

        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          
          {viewMode === 'dashboard' && (
          <>
          {/* Dashboard Content */}
          {/* KPIs Row */}
          <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Patrimônio Total
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {clientsLoading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <div className="text-2xl font-bold">
                    {useMockData ? "R$ 15.231.894" : formatCurrency(totalWealth || 0)}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  <span className="inline-flex items-center text-green-600">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +20.1%
                  </span>{" "}
                  em relação ao mês anterior
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Clientes Ativos
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {clientsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">
                    {useMockData ? "156" : stats.total}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  <span className="inline-flex items-center text-green-600">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {useMockData ? "+8" : `${clients.filter((c: Client) => c.active).length} ativos`}
                  </span>{" "}
                  {useMockData ? "novos este mês" : "no sistema"}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Alinhamento Médio
                </CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {clientsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">
                    {useMockData ? "87%" : `${stats.average.toFixed(1)}%`}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  <span className="inline-flex items-center text-red-600">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    {useMockData ? "-3%" : `${stats.lowAlignment} baixo alinhamento`}
                  </span>{" "}
                  {useMockData ? "desde o último trimestre" : "(&lt; 70%)"}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total de Metas
                </CardTitle>
                <PieChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {goalsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">
                    {useMockData ? "42" : goalsStats.total}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  <span className="inline-flex items-center text-yellow-600">
                    <Calendar className="h-3 w-3 mr-1" />
                    {useMockData ? "8 próximas" : `${goalsStats.nearTarget} próximas`}
                  </span>{" "}
                  (90 dias)
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Row */}
          <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
            {/* Alocação de Ativos */}
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Alocação de Ativos</CardTitle>
                <CardDescription>
                  Distribuição do patrimônio total por classe de ativos
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium">Renda Fixa</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">40%</span>
                      <span className="text-sm font-medium">R$ 6.092.758</span>
                    </div>
                  </div>
                  <Progress value={40} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">Ações</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">35%</span>
                      <span className="text-sm font-medium">R$ 5.331.163</span>
                    </div>
                  </div>
                  <Progress value={35} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm font-medium">Fundos Imobiliários</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">15%</span>
                      <span className="text-sm font-medium">R$ 2.284.784</span>
                    </div>
                  </div>
                  <Progress value={15} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="text-sm font-medium">Cripto</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">10%</span>
                      <span className="text-sm font-medium">R$ 1.523.189</span>
                    </div>
                  </div>
                  <Progress value={10} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Ações Rápidas */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
                <CardDescription>
                  Funcionalidades mais utilizadas
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <Button 
                  className="justify-start h-auto p-4" 
                  variant="outline"
                  onClick={() => router.push('/projections')}
                >
                  <div className="flex items-center space-x-3">
                    <Calculator className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">Simular Projeção</div>
                      <div className="text-sm text-muted-foreground">
                        Calcular cenários futuros
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 ml-auto" />
                </Button>
                
                <Button 
                  className="justify-start h-auto p-4" 
                  variant="outline"
                  onClick={() => router.push('/clients')}
                >
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">Novo Cliente</div>
                      <div className="text-sm text-muted-foreground">
                        Cadastrar novo cliente
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 ml-auto" />
                </Button>
                
                <Button 
                  className="justify-start h-auto p-4" 
                  variant="outline"
                  onClick={() => router.push('/portfolio')}
                >
                  <div className="flex items-center space-x-3">
                    <Wallet className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">Rebalancear</div>
                      <div className="text-sm text-muted-foreground">
                        Ajustar portfólios
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 ml-auto" />
                </Button>
                
                <Button 
                  className="justify-start h-auto p-4" 
                  variant="outline"
                  onClick={() => router.push('/insurance')}
                >
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">Seguros</div>
                      <div className="text-sm text-muted-foreground">
                        Gerenciar apólices
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 ml-auto" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Row */}
          <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
            {/* Clientes com Baixo Alinhamento */}
            <Card>
              <CardHeader>
                <CardTitle>Clientes - Baixo Alinhamento</CardTitle>
                <CardDescription>
                  Clientes que precisam de atenção
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Carlos Silva</p>
                      <p className="text-xs text-muted-foreground">carlos@email.com</p>
                    </div>
                    <Badge variant="destructive">45%</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Ana Costa</p>
                      <p className="text-xs text-muted-foreground">ana@email.com</p>
                    </div>
                    <Badge variant="destructive">38%</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Roberto Ferreira</p>
                      <p className="text-xs text-muted-foreground">roberto@email.com</p>
                    </div>
                    <Badge variant="secondary">62%</Badge>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => router.push('/clients')}
                  >
                    Ver Todos os Clientes
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Metas Próximas do Vencimento */}
            <Card>
              <CardHeader>
                <CardTitle>Metas Próximas</CardTitle>
                <CardDescription>
                  Objetivos com vencimento em 90 dias
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {useMockData ? (
                    // Mock data para demonstração
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Aposentadoria - João</p>
                          <p className="text-xs text-muted-foreground">Vence em 45 dias</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">R$ 2.5M</p>
                          <Badge variant="secondary">89%</Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Casa Nova - Marina</p>
                          <p className="text-xs text-muted-foreground">Vence em 67 dias</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">R$ 800K</p>
                          <Badge variant="default">95%</Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Educação - Pedro</p>
                          <p className="text-xs text-muted-foreground">Vence em 82 dias</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">R$ 300K</p>
                          <Badge variant="outline">76%</Badge>
                        </div>
                      </div>
                    </>
                  ) : (
                    // Dados reais da API
                    goals
                      .filter((goal: Goal) => {
                        if (!goal.targetDate) return false
                        const targetDate = new Date(goal.targetDate)
                        const now = new Date()
                        const diffTime = targetDate.getTime() - now.getTime()
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                        return diffDays <= 90 && diffDays > 0
                      })
                      .slice(0, 3)
                      .map((goal: Goal) => {
                        const targetDate = new Date(goal.targetDate)
                        const now = new Date()
                        const diffTime = targetDate.getTime() - now.getTime()
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                        const progress = (goal.currentValue || 0) && goal.targetValue 
                          ? Math.round(((goal.currentValue || 0) / goal.targetValue) * 100)
                          : 0
                        
                        return (
                          <div key={goal.id} className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">{goal.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Vence em {diffDays} dias
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                {goal.targetValue ? formatCurrency(goal.targetValue) : "N/A"}
                              </p>
                              <Badge variant={
                                progress >= 80 ? "default" : 
                                progress >= 60 ? "secondary" : "outline"
                              }>
                                {progress}%
                              </Badge>
                            </div>
                          </div>
                        )
                      })
                  )}
                  
                  {/* Mostra mensagem se não houver metas próximas */}
                  {!useMockData && goalsStats.nearTarget === 0 && (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">
                        Nenhuma meta próxima do vencimento nos próximos 90 dias
                      </p>
                    </div>
                  )}
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => router.push('/goals')}
                  >
                    Ver Todas as Metas
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          </>
          )}
          
          {/* Reports View */}
          {viewMode === 'reports' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Relatórios Avançados</CardTitle>
                  <CardDescription>
                    Análises detalhadas e insights de performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Análise de Clientes</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Clientes Ativos</span>
                          <span className="font-medium">{stats.total}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Alinhamento &gt; 80%</span>
                          <span className="font-medium text-green-600">
                            {clients.filter((c: Client) => (c.alignmentPercentage || 0) > 80).length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Baixo Alinhamento &lt; 60%</span>
                          <span className="font-medium text-red-600">
                            {clients.filter((c: Client) => (c.alignmentPercentage || 0) < 60).length}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Performance Financeira</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Patrimônio Total</span>
                          <span className="font-medium">{formatCurrency(totalWealth || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Metas Próximas ao Alvo</span>
                          <span className="font-medium text-blue-600">{goalsStats.nearTarget}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total de Metas</span>
                          <span className="font-medium">{goalsStats.total}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="text-lg font-semibold mb-4">Ações Recomendadas</h3>
                    <div className="space-y-3">
                      {clients.filter((c: Client) => (c.alignmentPercentage || 0) < 70).length > 0 && (
                        <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                          <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                          <div>
                            <p className="font-medium text-yellow-800">
                              Revisar Alinhamento de Clientes
                            </p>
                            <p className="text-sm text-yellow-600">
                              {clients.filter((c: Client) => (c.alignmentPercentage || 0) < 70).length} clientes 
                              com alinhamento abaixo de 70% precisam de atenção
                            </p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                        <Calculator className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-blue-800">
                            Executar Projeções Trimestrais
                          </p>
                          <p className="text-sm text-blue-600">
                            Realize simulações de cenários para o próximo trimestre
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                        <Shield className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-green-800">
                            Revisar Coberturas de Seguro
                          </p>
                          <p className="text-sm text-green-600">
                            Verifique se as apólices estão adequadas aos perfis dos clientes
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
