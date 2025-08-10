"use client"

export const dynamic = 'force-dynamic'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { Skeleton } from "@/components/ui/skeleton"

import { Checkbox } from "@/components/ui/checkbox"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { useSimulations, useDeleteSimulation } from "@/hooks/use-api"
import { 
  History,
  Search,
  Eye,

  Trash2,
  Calendar,
  TrendingUp,
  GitCompare,
  AlertTriangle,
  FileText
} from "lucide-react"
import { toast } from "sonner"

interface SimulationChartData {
  year: number
  [key: string]: number | string
}

interface Simulation {
  id: string
  name: string
  description?: string
  clientId: string
  clientName?: string
  parameters: Record<string, unknown>
  results: Array<{
    year: number
    projectedValue: number
    totalContributions: number
    totalWithdrawals: number
    growth: number
  }>
  version: number
  createdAt: string
}

export default function SimulationsPage() {
  const [search, setSearch] = useState("")
  const [selectedSimulations, setSelectedSimulations] = useState<string[]>([])
  const [showComparison, setShowComparison] = useState(false)
  const [viewingSimulation, setViewingSimulation] = useState<Simulation | null>(null)
  
  const { data: simulationsData, isLoading, error } = useSimulations()
  const deleteSimulation = useDeleteSimulation()

  const handleDeleteSimulation = async (simulationId: string, simulationName: string) => {
    if (confirm(`Tem certeza que deseja remover a simulação "${simulationName}"?`)) {
      try {
        await deleteSimulation.mutateAsync(simulationId)
        toast.success("Simulação removida com sucesso!")
      } catch (error) {
        console.error("Erro ao deletar simulação:", error)
        toast.error("Erro ao remover simulação")
      }
    }
  }

  const handleSelectSimulation = (simulationId: string) => {
    setSelectedSimulations(prev => 
      prev.includes(simulationId) 
        ? prev.filter(id => id !== simulationId)
        : prev.length < 3 ? [...prev, simulationId] : prev
    )
  }

  const handleViewSimulation = (simulation: Simulation) => {
    setViewingSimulation(simulation)
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

  const simulations: Simulation[] = (simulationsData?.data as Simulation[]) ?? []
  const selectedSimulationData = simulations.filter((sim: Simulation) => selectedSimulations.includes(sim.id))

  const generateComparisonData = () => {
    if (selectedSimulationData.length === 0) return []
    
    const years = selectedSimulationData[0]?.results?.map(r => r.year) || []
    
    return years.map(year => {
      const data: SimulationChartData = { year }
      selectedSimulationData.forEach((sim, index) => {
        const result = sim.results.find(r => r.year === year)
        data[`simulation_${index}`] = result?.projectedValue || 0
        data[`name_${index}`] = sim.name
      })
      return data
    })
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="p-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>Erro ao carregar simulações. Verifique se o backend está rodando.</span>
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
          <h1 className="text-3xl font-bold tracking-tight">Simulações</h1>
          <p className="text-muted-foreground">
            Visualize e compare suas simulações financeiras salvas
          </p>
        </div>
        
        {selectedSimulations.length > 1 && (
          <Button 
            onClick={() => setShowComparison(true)}
            variant="outline"
          >
            <GitCompare className="mr-2 h-4 w-4" />
            Comparar Simulações ({selectedSimulations.length})
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Simulações</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{simulations.length}</div>
            <p className="text-xs text-muted-foreground">
              {simulations.filter(s => new Date(s.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length} este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Únicos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(simulations.map(s => s.clientId)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Com simulações ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Simulação Mais Recente</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {simulations.length > 0 ? formatDate(simulations[0]?.createdAt) : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              Última criada
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.2%</div>
            <p className="text-xs text-muted-foreground">
              Taxa real anual
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Simulações</CardTitle>
          <CardDescription>
            Selecione até 3 simulações para comparar
          </CardDescription>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar simulações..."
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
                  <TableHead className="w-12">Comparar</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Valor Final</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {simulations.map((simulation) => (
                  <TableRow key={simulation.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedSimulations.includes(simulation.id)}
                        onCheckedChange={() => handleSelectSimulation(simulation.id)}
                        disabled={!selectedSimulations.includes(simulation.id) && selectedSimulations.length >= 3}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>
                        <div>{simulation.name}</div>
                        {simulation.description && (
                          <div className="text-sm text-muted-foreground">{simulation.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{simulation.clientName || simulation.clientId}</TableCell>
                    <TableCell>
                      {simulation.results?.length > 0 
                        ? formatCurrency(simulation.results[simulation.results.length - 1]?.projectedValue || 0)
                        : "N/A"
                      }
                    </TableCell>
                    <TableCell>
                      {simulation.results?.length > 0 
                        ? `${simulation.results[0]?.year} - ${simulation.results[simulation.results.length - 1]?.year}`
                        : "N/A"
                      }
                    </TableCell>
                    <TableCell>{formatDate(simulation.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewSimulation(simulation)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteSimulation(simulation.id, simulation.name)}
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

          {!isLoading && simulations.length === 0 && (
            <div className="text-center py-12">
              <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma simulação encontrada</h3>
              <p className="text-muted-foreground mb-4">
                {search ? "Tente ajustar os termos de busca" : "Crie sua primeira simulação para vê-la aqui"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Simulation Detail Dialog */}
      <Dialog open={!!viewingSimulation} onOpenChange={() => setViewingSimulation(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Simulação: {viewingSimulation?.name}
            </DialogTitle>
          </DialogHeader>
          
          {viewingSimulation && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cliente</p>
                  <p className="text-sm">{viewingSimulation.clientName || viewingSimulation.clientId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Versão</p>
                  <p className="text-sm">v{viewingSimulation.version}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Criado em</p>
                  <p className="text-sm">{formatDate(viewingSimulation.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Período</p>
                  <p className="text-sm">
                    {viewingSimulation.results?.length > 0 
                      ? `${viewingSimulation.results[0]?.year} - ${viewingSimulation.results[viewingSimulation.results.length - 1]?.year}`
                      : "N/A"
                    }
                  </p>
                </div>
              </div>

              {viewingSimulation.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Descrição</p>
                  <p className="text-sm">{viewingSimulation.description}</p>
                </div>
              )}

              <div>
                <h4 className="text-lg font-semibold mb-4">Projeção Patrimonial</h4>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={viewingSimulation.results}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis 
                        tickFormatter={(value) => formatCurrency(value).replace('R$', '').trim()}
                      />
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), 'Valor Projetado']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="projectedValue" 
                        stroke="#2563eb" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Comparison Dialog */}
      <Dialog open={showComparison} onOpenChange={setShowComparison}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Comparação de Simulações
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {selectedSimulationData.map((simulation) => (
                <Card key={simulation.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{simulation.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Cliente:</span>
                        <span>{simulation.clientName || simulation.clientId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Valor Final:</span>
                        <span className="font-medium">
                          {simulation.results?.length > 0 
                            ? formatCurrency(simulation.results[simulation.results.length - 1]?.projectedValue || 0)
                            : "N/A"
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Período:</span>
                        <span>
                          {simulation.results?.length > 0 
                            ? `${simulation.results.length} anos`
                            : "N/A"
                          }
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Comparação Visual</h4>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={generateComparisonData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis 
                      tickFormatter={(value) => formatCurrency(value).replace('R$', '').trim()}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        const index = name.split('_')[1]
                        const simName = generateComparisonData().find(d => d[`name_${index}`])?.[`name_${index}`] || `Simulação ${parseInt(index) + 1}`
                        return [formatCurrency(value), simName]
                      }}
                    />
                    <Legend 
                      formatter={(value) => {
                        const index = value.split('_')[1]
                        return selectedSimulationData[parseInt(index)]?.name || `Simulação ${parseInt(index) + 1}`
                      }}
                    />
                    {selectedSimulationData.map((_, index) => (
                      <Line 
                        key={index}
                        type="monotone" 
                        dataKey={`simulation_${index}`}
                        stroke={['#2563eb', '#dc2626', '#16a34a'][index % 3]}
                        strokeWidth={2}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
