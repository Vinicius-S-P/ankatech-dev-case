"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

import { Progress } from "@/components/ui/progress"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { InsuranceForm } from "@/components/forms/insurance-form"
import { useInsurance, useDeleteInsurance, useClients } from "@/hooks/use-api"
import { 
  Shield,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Calendar,
  FileText,
  PieChartIcon,
  BarChart3
} from "lucide-react"
import { toast } from "sonner"

interface Insurance {
  id: string
  clientId: string
  clientName?: string
  type: 'LIFE' | 'DISABILITY' | 'HEALTH' | 'PROPERTY'
  provider: string
  policyNumber?: string
  coverage: number
  premium: number
  premiumFrequency: 'MONTHLY' | 'YEARLY' | 'ONCE'
  startDate: string
  endDate?: string
  createdAt: string
  updatedAt: string
}

interface Client {
  id: string
  name: string
  email: string
  age: number
  totalWealth: number
  alignmentPercentage?: number
  active: boolean
  advisorId?: string
  createdAt: string
  updatedAt: string
}

const insuranceTypeLabels = {
  LIFE: 'Vida',
  DISABILITY: 'Invalidez',
  HEALTH: 'Saúde',
  PROPERTY: 'Patrimonial'
}

const insuranceTypeColors = {
  LIFE: '#2563eb',
  DISABILITY: '#dc2626', 
  HEALTH: '#16a34a',
  PROPERTY: '#ca8a04'
}

const frequencyLabels = {
  MONTHLY: 'Mensal',
  YEARLY: 'Anual',
  ONCE: 'Único'
}

export default function InsurancePage() {
  const searchParams = useSearchParams()
  const [search, setSearch] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingInsurance, setEditingInsurance] = useState<Insurance | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'distribution' | 'reports'>('table')
  
  useEffect(() => {
    const view = searchParams.get('view')
    if (view === 'distribution' || view === 'reports') {
      setViewMode(view)
    }
  }, [searchParams])
  
  const { data: insuranceData, isLoading, error } = useInsurance(1, 50, search)
  const { data: clientsData } = useClients()
  const deleteInsurance = useDeleteInsurance()

  const handleDeleteInsurance = async (insuranceId: string, policyNumber: string) => {
    if (confirm(`Tem certeza que deseja remover a apólice "${policyNumber}"?`)) {
      try {
        await deleteInsurance.mutateAsync(insuranceId)
        toast.success("Seguro removido com sucesso!")
      } catch (error) {
        console.error("Erro ao deletar seguro:", error)
        toast.error("Erro ao remover seguro")
      }
    }
  }

  const handleEditInsurance = (insurance: Insurance) => {
    setEditingInsurance(insurance)
    setIsDialogOpen(true)
  }

  const handleFormSuccess = () => {
    setIsDialogOpen(false)
    setEditingInsurance(null)
    toast.success("Operação realizada com sucesso!")
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const clients = clientsData?.clients || [];
  const insurance: Insurance[] = (insuranceData?.insurance as Insurance[] || []).map(ins => ({
    ...ins,
    clientName: clients.find((client: Client) => client.id === ins.clientId)?.name || ins.clientId
  }));

  const totalCoverage = insurance.reduce((sum: number, ins: Insurance) => sum + ins.coverage, 0)
  const totalPremiums = insurance.reduce((sum: number, ins: Insurance) => {
    const annualPremium = ins.premiumFrequency === 'MONTHLY' ? ins.premium * 12 : ins.premium
    return sum + annualPremium
  }, 0)

  const distributionData = Object.entries(insuranceTypeLabels).map(([type, label]) => {
    const key = type as keyof typeof insuranceTypeLabels
    const typeInsurance = insurance.filter((ins: Insurance) => ins.type === key)
    const coverage = typeInsurance.reduce((sum: number, ins: Insurance) => sum + ins.coverage, 0)
    const count = typeInsurance.length
    
    return {
      name: label,
      value: coverage,
      count,
      percentage: totalCoverage > 0 ? (coverage / totalCoverage) * 100 : 0,
      color: insuranceTypeColors[key as keyof typeof insuranceTypeColors]
    }
  }).filter(item => item.count > 0)

  type ProviderAgg = { provider: string; premium: number; coverage: number; policies: number }
  const providerData: ProviderAgg[] = insurance.reduce<ProviderAgg[]>((acc, ins) => {
    const existing = acc.find(item => item.provider === ins.provider)
    const annualPremium = ins.premiumFrequency === 'MONTHLY' ? ins.premium * 12 : ins.premium
    
    if (existing) {
      existing.premium += annualPremium
      existing.coverage += ins.coverage
      existing.policies += 1
    } else {
      acc.push({
        provider: ins.provider,
        premium: annualPremium,
        coverage: ins.coverage,
        policies: 1
      })
    }
    return acc
  }, []).sort((a: ProviderAgg, b: ProviderAgg) => b.premium - a.premium).slice(0, 5)

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="p-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>Erro ao carregar seguros. Verifique se o backend está rodando.</span>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Seguros</h1>
          <p className="text-muted-foreground">
            Gerencie apólices de seguro e acompanhe a distribuição de cobertura
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <FileText className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'distribution' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('distribution')}
            >
              <PieChartIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'reports' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('reports')}
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) setEditingInsurance(null)
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Apólice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingInsurance ? "Editar Apólice" : "Nova Apólice"}
                </DialogTitle>
              </DialogHeader>
              <InsuranceForm 
                insurance={editingInsurance}
                onSuccess={handleFormSuccess}
                onCancel={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Apólices</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insurance.length}</div>
            <p className="text-xs text-muted-foreground">
              {insurance.filter(ins => !ins.endDate || new Date(ins.endDate) > new Date()).length} ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cobertura Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCoverage)}</div>
            <p className="text-xs text-muted-foreground">
              Valor assegurado total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prêmios Anuais</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPremiums)}</div>
            <p className="text-xs text-muted-foreground">
              Custo total anual
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Cobertos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(insurance.map(ins => ins.clientId)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Clientes únicos
            </p>
          </CardContent>
        </Card>
      </div>

      {viewMode === 'table' && (
        <Card>
          <CardHeader>
            <CardTitle>Lista de Apólices</CardTitle>
            <CardDescription>
              Visualize e gerencie todas as apólices de seguro
            </CardDescription>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar apólices..."
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
                    <TableHead>Tipo</TableHead>
                    <TableHead>Provedor</TableHead>
                    <TableHead>Nº Apólice</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Cobertura</TableHead>
                    <TableHead>Prêmio</TableHead>
                    <TableHead>Vigência</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {insurance.map((ins) => (
                    <TableRow key={ins.id}>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          style={{ 
                            borderColor: insuranceTypeColors[ins.type],
                            color: insuranceTypeColors[ins.type]
                          }}
                        >
                          {insuranceTypeLabels[ins.type]}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{ins.provider}</TableCell>
                      <TableCell>{ins.policyNumber || "N/A"}</TableCell>
                      <TableCell>{ins.clientName || ins.clientId}</TableCell>
                      <TableCell>{formatCurrency(ins.coverage)}</TableCell>
                      <TableCell>
                        <div>
                          <div>{formatCurrency(ins.premium)}</div>
                          <div className="text-xs text-muted-foreground">
                            {frequencyLabels[ins.premiumFrequency]}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{formatDate(ins.startDate)}</div>
                          {ins.endDate && (
                            <div className="text-xs text-muted-foreground">
                              até {formatDate(ins.endDate)}
                            </div>
                          )}
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
                            onClick={() => handleEditInsurance(ins)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteInsurance(ins.id, ins.policyNumber || ins.provider)}
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

            {!isLoading && insurance.length === 0 && (
              <div className="text-center py-12">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma apólice encontrada</h3>
                <p className="text-muted-foreground mb-4">
                  {search ? "Tente ajustar os termos de busca" : "Comece adicionando sua primeira apólice"}
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Apólice
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {viewMode === 'distribution' && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Tipo</CardTitle>
              <CardDescription>
                Cobertura total por categoria de seguro
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                    >
                      {distributionData.map((entry, index) => (
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
              <CardTitle>Resumo por Categoria</CardTitle>
              <CardDescription>
                Detalhamento das coberturas por tipo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                          {distributionData.map((item) => (
                  <div key={item.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(item.value)}</div>
                        <div className="text-sm text-muted-foreground">{item.count} apólices</div>
                      </div>
                    </div>
                    <Progress value={item.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {viewMode === 'reports' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Prêmios por Provedor</CardTitle>
              <CardDescription>
                Top 5 provedores por valor de prêmio anual
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={providerData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="provider" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      tickFormatter={(value) => formatCurrency(value).replace('R$', '').trim()}
                    />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Prêmio Anual']}
                      labelFormatter={(label) => `Provedor: ${label}`}
                    />
                    <Bar dataKey="premium" fill="#2563eb" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Relatório de Cobertura</CardTitle>
                <CardDescription>
                  Análise detalhada por categoria
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {distributionData.map((item) => (
                    <div key={item.name} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{item.name}</h4>
                        <Badge variant="outline">{item.count} apólices</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Cobertura Total</p>
                          <p className="font-medium">{formatCurrency(item.value)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">% do Portfolio</p>
                          <p className="font-medium">{item.percentage.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Análise de Custos</CardTitle>
                <CardDescription>
                  Resumo financeiro dos seguros
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Custo vs Cobertura</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Prêmio Total Anual:</span>
                        <span className="font-medium">{formatCurrency(totalPremiums)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cobertura Total:</span>
                        <span className="font-medium">{formatCurrency(totalCoverage)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-muted-foreground">Ratio Custo/Cobertura:</span>
                        <span className="font-medium">
                          {totalCoverage > 0 ? ((totalPremiums / totalCoverage) * 100).toFixed(2) : '0'}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Distribuição de Custos</h4>
                    <div className="space-y-2">
                      {distributionData.map((item) => {
                        const key = (Object.keys(insuranceTypeLabels).find(k => insuranceTypeLabels[k as keyof typeof insuranceTypeLabels] === item.name) || 'LIFE') as keyof typeof insuranceTypeLabels
                        const typePremiums = insurance
                          .filter((ins: Insurance) => ins.type === key)
                          .reduce((sum: number, ins: Insurance) => {
                            const annualPremium = ins.premiumFrequency === 'MONTHLY' ? ins.premium * 12 : ins.premium
                            return sum + annualPremium
                          }, 0)
                        
                        return (
                          <div key={item.name} className="flex justify-between">
                            <span className="text-muted-foreground">{item.name}:</span>
                            <span className="font-medium">{formatCurrency(typePremiums)}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
