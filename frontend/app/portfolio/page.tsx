"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from "recharts"
import { WalletForm } from "@/components/forms/wallet-form"
import { RebalanceDialog } from "@/components/dialogs/rebalance-dialog"
import { useWallets, useDeleteWallet, useRebalancePortfolio } from "@/hooks/use-api"
import { 
  Wallet,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  TrendingUp,

  DollarSign,
  PieChart as PieChartIcon,

  RefreshCw,
  Target,
  Activity
} from "lucide-react"
import { toast } from "sonner"

interface WalletData {
  id: string
  clientId: string
  clientName?: string
  assetClass: 'STOCKS' | 'BONDS' | 'REAL_ESTATE' | 'COMMODITIES' | 'CASH' | 'CRYPTO' | 'PRIVATE_EQUITY' | 'OTHER'
  description?: string
  currentValue: number
  percentage: number
  targetPercentage?: number
  performance?: {
    oneMonth: number
    threeMonths: number
    sixMonths: number
    oneYear: number
  }
  createdAt: string
  updatedAt: string
}

const assetClassLabels = {
  STOCKS: 'Ações',
  BONDS: 'Renda Fixa',
  REAL_ESTATE: 'Fundos Imobiliários',
  COMMODITIES: 'Commodities',
  CASH: 'Caixa',
  CRYPTO: 'Criptomoedas',
  PRIVATE_EQUITY: 'Private Equity',
  OTHER: 'Outros'
}

const assetClassColors = {
  STOCKS: '#2563eb',
  BONDS: '#16a34a',
  REAL_ESTATE: '#ca8a04',
  COMMODITIES: '#dc2626',
  CASH: '#64748b',
  CRYPTO: '#7c3aed',
  PRIVATE_EQUITY: '#ea580c',
  OTHER: '#6b7280'
}

const targetAllocations = {
  CONSERVATIVE: {
    BONDS: 60,
    STOCKS: 25,
    REAL_ESTATE: 10,
    CASH: 5
  },
  MODERATE: {
    STOCKS: 50,
    BONDS: 30,
    REAL_ESTATE: 15,
    CASH: 5
  },
  AGGRESSIVE: {
    STOCKS: 70,
    BONDS: 15,
    REAL_ESTATE: 10,
    CRYPTO: 3,
    CASH: 2
  }
}

export default function PortfolioPage() {
  const [search, setSearch] = useState("")
  const [selectedClient, setSelectedClient] = useState<string>("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isRebalanceOpen, setIsRebalanceOpen] = useState(false)
  const [editingWallet, setEditingWallet] = useState<WalletData | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  
  // Support URL tab parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const tabParam = urlParams.get('tab')
    if (tabParam && ['overview', 'allocation', 'performance', 'positions'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [])
  const [selectedProfile, setSelectedProfile] = useState<'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE'>('MODERATE')
  
  const { data: walletsData, isLoading, error } = useWallets(selectedClient, 1, 100, search)
  const deleteWallet = useDeleteWallet()
  const rebalancePortfolio = useRebalancePortfolio()

  const handleDeleteWallet = async (walletId: string, description: string) => {
    if (confirm(`Tem certeza que deseja remover "${description}"?`)) {
      try {
        await deleteWallet.mutateAsync(walletId)
        toast.success("Posição removida com sucesso!")
      } catch (error) {
        console.error("Erro ao deletar posição:", error)
        toast.error("Erro ao remover posição")
      }
    }
  }

  const handleEditWallet = (wallet: WalletData) => {
    setEditingWallet(wallet)
    setIsDialogOpen(true)
  }

  const handleFormSuccess = () => {
    setIsDialogOpen(false)
    setEditingWallet(null)
    toast.success("Operação realizada com sucesso!")
  }

  const handleRebalance = async (targetAllocations: Record<string, number>) => {
    try {
      await rebalancePortfolio.mutateAsync({
        clientId: selectedClient,
        targetAllocations
      })
      toast.success("Rebalanceamento realizado com sucesso!")
      setIsRebalanceOpen(false)
    } catch (error) {
      console.error("Erro no rebalanceamento:", error)
      toast.error("Erro ao rebalancear portfólio")
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const wallets: WalletData[] = (walletsData?.data as WalletData[]) ?? []
  const totalValue = wallets.reduce((sum: number, wallet: WalletData) => sum + wallet.currentValue, 0)

  // Dados para distribuição atual
  const currentDistribution = Object.entries(assetClassLabels).map(([assetClass, label]) => {
    const classWallets = wallets.filter((w: WalletData) => w.assetClass === (assetClass as WalletData['assetClass']))
    const value = classWallets.reduce((sum: number, w: WalletData) => sum + w.currentValue, 0)
    const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0
    
    return {
      name: label,
      value,
      percentage,
      count: classWallets.length,
      color: assetClassColors[assetClass as keyof typeof assetClassColors]
    }
  }).filter((item) => item.value > 0)

  // Dados para alocação alvo
  const targetDistribution = Object.entries(targetAllocations[selectedProfile]).map(([assetClass, targetPercentage]) => ({
    name: assetClassLabels[assetClass as keyof typeof assetClassLabels],
    current: currentDistribution.find(d => d.name === assetClassLabels[assetClass as keyof typeof assetClassLabels])?.percentage || 0,
    target: targetPercentage,
    difference: (currentDistribution.find(d => d.name === assetClassLabels[assetClass as keyof typeof assetClassLabels])?.percentage || 0) - targetPercentage
  }))

  // Dados de performance mock
  const performanceData = [
    { period: 'Jan', portfolio: 2.1, benchmark: 1.8 },
    { period: 'Fev', portfolio: -0.5, benchmark: 0.2 },
    { period: 'Mar', portfolio: 3.2, benchmark: 2.9 },
    { period: 'Abr', portfolio: 1.8, benchmark: 1.5 },
    { period: 'Mai', portfolio: -1.2, benchmark: -0.8 },
    { period: 'Jun', portfolio: 2.9, benchmark: 2.1 }
  ]

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="p-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>Erro ao carregar carteiras. Verifique se o backend está rodando.</span>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfólio de Investimentos</h1>
          <p className="text-muted-foreground">
            Gerencie alocações, performance e rebalanceamento de carteiras
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsRebalanceOpen(true)}
            disabled={!selectedClient || wallets.length === 0}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Rebalancear
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) setEditingWallet(null)
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Posição
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingWallet ? "Editar Posição" : "Nova Posição"}
                </DialogTitle>
              </DialogHeader>
              <WalletForm 
                wallet={editingWallet}
                onSuccess={handleFormSuccess}
                onCancel={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Client Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Seleção de Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Digite o ID do cliente ou busque..."
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {selectedClient && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Patrimônio Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
              <p className="text-xs text-muted-foreground">
                <span className="inline-flex items-center text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +2.4%
                </span>{" "}
                este mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Classes de Ativos</CardTitle>
              <PieChartIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentDistribution.length}</div>
              <p className="text-xs text-muted-foreground">
                {wallets.length} posições ativas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance 12M</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+12.4%</div>
              <p className="text-xs text-muted-foreground">
                <span className="inline-flex items-center text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  vs benchmark +9.8%
                </span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Desvio da Meta</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {targetDistribution.reduce((sum, item) => sum + Math.abs(item.difference), 0).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Desvio total da alocação
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      {selectedClient ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="allocation">Alocação</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="positions">Posições</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição Atual</CardTitle>
                  <CardDescription>Alocação por classe de ativo</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={currentDistribution}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                        >
                          {currentDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance vs Benchmark</CardTitle>
                  <CardDescription>Últimos 6 meses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis tickFormatter={(value) => `${value}%`} />
                        <Tooltip formatter={(value: number) => `${value}%`} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="portfolio" 
                          stroke="#2563eb" 
                          strokeWidth={2}
                          name="Portfólio"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="benchmark" 
                          stroke="#64748b" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          name="Benchmark"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="allocation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Alocação Estratégica</CardTitle>
                <CardDescription>
                  Compare a alocação atual com o perfil de investimento
                </CardDescription>
                <div className="flex gap-2">
                  {Object.keys(targetAllocations).map((profile) => (
                    <Button
                      key={profile}
                      variant={selectedProfile === profile ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedProfile(profile as 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE')}
                    >
                      {profile === 'CONSERVATIVE' ? 'Conservador' : 
                       profile === 'MODERATE' ? 'Moderado' : 'Agressivo'}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {targetDistribution.map((item) => (
                    <div key={item.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{item.name}</span>
                        <div className="flex items-center gap-4 text-sm">
                          <span>Atual: {formatPercentage(item.current)}</span>
                          <span>Meta: {formatPercentage(item.target)}</span>
                          <span className={`font-medium ${item.difference > 0 ? 'text-blue-600' : item.difference < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                            {item.difference > 0 ? '+' : ''}{formatPercentage(item.difference)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Progress value={item.current} className="h-2" />
                        </div>
                        <div className="flex-1">
                          <Progress value={item.target} className="h-2 bg-muted" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance por Classe de Ativo</CardTitle>
                  <CardDescription>Retorno dos últimos 12 meses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={currentDistribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(value) => `${value}%`} />
                        <Tooltip 
                          formatter={(value: number) => [`${value.toFixed(1)}%`, 'Performance']}
                        />
                        <Bar dataKey="percentage" fill="#2563eb" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">1 Mês</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">+2.4%</div>
                    <p className="text-xs text-muted-foreground">vs benchmark +1.8%</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">3 Meses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">+7.1%</div>
                    <p className="text-xs text-muted-foreground">vs benchmark +5.9%</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">6 Meses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">+8.3%</div>
                    <p className="text-xs text-muted-foreground">vs benchmark +6.2%</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">12 Meses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">+12.4%</div>
                    <p className="text-xs text-muted-foreground">vs benchmark +9.8%</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="positions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Posições Detalhadas</CardTitle>
                <CardDescription>
                  Todas as posições do cliente selecionado
                </CardDescription>
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar posições..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[200px]" />
                          <Skeleton className="h-4 w-[150px]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Classe de Ativo</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Valor Atual</TableHead>
                        <TableHead>% Portfólio</TableHead>
                        <TableHead>Performance</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {wallets.map((wallet) => (
                        <TableRow key={wallet.id}>
                          <TableCell>
                            <Badge 
                              variant="outline"
                              style={{ 
                                borderColor: assetClassColors[wallet.assetClass],
                                color: assetClassColors[wallet.assetClass]
                              }}
                            >
                              {assetClassLabels[wallet.assetClass]}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {wallet.description || "N/A"}
                          </TableCell>
                          <TableCell>{formatCurrency(wallet.currentValue)}</TableCell>
                          <TableCell>{formatPercentage(wallet.percentage)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3 text-green-600" />
                              <span className="text-green-600 text-sm">+5.2%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleEditWallet(wallet)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeleteWallet(wallet.id, wallet.description || wallet.assetClass)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {!isLoading && wallets.length === 0 && (
                  <div className="text-center py-12">
                    <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma posição encontrada</h3>
                    <p className="text-muted-foreground mb-4">
                      {search ? "Tente ajustar os termos de busca" : "Comece adicionando a primeira posição"}
                    </p>
                    <Button onClick={() => setIsDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Posição
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center h-96">
            <div className="text-center">
              <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Selecione um Cliente</h3>
              <p className="text-muted-foreground">
                Digite o ID do cliente para visualizar e gerenciar seu portfólio
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rebalance Dialog */}
      <RebalanceDialog
        open={isRebalanceOpen}
        onOpenChange={setIsRebalanceOpen}
        currentAllocations={currentDistribution}
        targetAllocations={targetAllocations[selectedProfile]}
        onRebalance={handleRebalance}
      />
    </div>
  )
}
