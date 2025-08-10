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
import { ClientForm } from "@/components/forms/client-form"
import { useClients, useDeleteClient } from "@/hooks/use-api"
import { 
  Plus, 
  Search, 
  Users, 
  Edit, 
  Trash2, 
  Eye,
  TrendingUp,
  TrendingDown,
  AlertTriangle
} from "lucide-react"
import { toast } from "sonner"

// Types
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

interface ClientsResponse {
  clients: Client[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Helper function for alignment badge
const getAlignmentBadge = (
  category?: "HIGH" | "MEDIUM_HIGH" | "MEDIUM_LOW" | "LOW",
  percentage?: number
) => {
  if (percentage === undefined || percentage === null) {
    return <Badge variant="secondary">N/A</Badge>
  }

  const badgeProps = {
    HIGH: { variant: "default" as const, color: "text-green-600", label: "Alto" },
    MEDIUM_HIGH: { variant: "secondary" as const, color: "text-yellow-600", label: "Médio-Alto" },
    MEDIUM_LOW: { variant: "outline" as const, color: "text-orange-600", label: "Médio-Baixo" },
    LOW: { variant: "destructive" as const, color: "text-red-600", label: "Baixo" }
  }[category || "MEDIUM_HIGH"]

  return (
    <div className="flex items-center gap-2">
      <Badge variant={badgeProps.variant}>{badgeProps.label}</Badge>
      <span className={`text-sm font-medium ${badgeProps.color}`}>{percentage.toFixed(1)}%</span>
    </div>
  )
}

export default function ClientsPage() {
  const searchParams = useSearchParams()
  const [search, setSearch] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'alignment' | 'import'>('table')
  
  // Initialize view mode from URL params
  useEffect(() => {
    const view = searchParams.get('view')
    if (view === 'alignment' || view === 'import') {
      setViewMode(view)
    }
  }, [searchParams])
  
  const { data: clientsData, isLoading, error, refetch } = useClients(1, 50, search)
  const deleteClient = useDeleteClient()
  
  const clients = (clientsData as ClientsResponse)?.clients || [] as Client[]
  const totalClients = (clientsData as ClientsResponse)?.pagination?.total || 0

  // Log para debug
  console.log('clientsData:', clientsData)
  console.log('clients array:', clients)
  console.log('clients length:', clients.length)
  console.log('isLoading:', isLoading)
  console.log('error:', error)

  const handleDeleteClient = async (clientId: string, clientName: string) => {
    if (confirm(`Tem certeza que deseja remover o cliente "${clientName}"?`)) {
      try {
        await deleteClient.mutateAsync(clientId)
      } catch (error) {
        console.error("Erro ao deletar cliente:", error)
      }
    }
  }

  const handleEditClient = (client: Client) => {
    setEditingClient(client)
    setIsDialogOpen(true)
  }

  const handleFormSuccess = () => {
    console.log('Form success called - fechando dialog e fazendo refresh')
    setIsDialogOpen(false)
    setEditingClient(null)
    
    // Force refresh da lista
    setTimeout(() => {
      refetch()
    }, 100)
    
    toast.success("Operação realizada com sucesso!")
  }

  // removed duplicate getAlignmentBadge (merged above)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="p-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>Erro ao carregar clientes. Verifique se o backend está rodando.</span>
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
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie seus clientes e acompanhe o alinhamento financeiro
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) setEditingClient(null)
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingClient ? "Editar Cliente" : "Novo Cliente"}
              </DialogTitle>
            </DialogHeader>
            <ClientForm 
              client={editingClient ? {
                ...editingClient,
                advisorId: editingClient.advisorId || "",
                alignmentCategory: (editingClient.alignmentCategory as "HIGH" | "MEDIUM_HIGH" | "MEDIUM_LOW" | "LOW" | undefined)
              } : undefined}
              onSuccess={handleFormSuccess}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClients}</div>
            <p className="text-xs text-muted-foreground">
              {clients.filter((c: Client) => c.active).length} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patrimônio Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(clients.reduce((sum: number, client: Client) => sum + (client.totalWealth || 0), 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Soma de todos os patrimônios
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alinhamento Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clients.length > 0 
                ? (clients.reduce((sum: number, client: Client) => sum + (client.alignmentPercentage || 0), 0) / clients.length).toFixed(1)
                : "0"
              }%
            </div>
            <p className="text-xs text-muted-foreground">
              Média de alinhamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Baixo Alinhamento</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clients.filter((c: Client) => (c.alignmentPercentage || 0) < 70).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Clientes &lt; 70% alinhamento
            </p>
          </CardContent>
        </Card>
      </div>

      {/* View Mode Selector */}
      <div className="flex items-center gap-2">
        <Button
          variant={viewMode === 'table' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('table')}
        >
          <Users className="h-4 w-4 mr-2" />
          Lista de Clientes
        </Button>
        <Button
          variant={viewMode === 'alignment' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('alignment')}
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Análise de Alinhamento
        </Button>
        <Button
          variant={viewMode === 'import' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('import')}
        >
          <Plus className="h-4 w-4 mr-2" />
          Importação de Dados
        </Button>
      </div>

      {/* Table View */}
      {viewMode === 'table' && (
      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os seus clientes
          </CardDescription>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar clientes..."
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
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Idade</TableHead>
                  <TableHead>Patrimônio</TableHead>
                  <TableHead>Alinhamento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client: Client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>{client.age} anos</TableCell>
                    <TableCell>{formatCurrency(client.totalWealth || 0)}</TableCell>
                    <TableCell>
                      {getAlignmentBadge(
                        client.alignmentCategory as "HIGH" | "MEDIUM_HIGH" | "MEDIUM_LOW" | "LOW" | undefined,
                        client.alignmentPercentage
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={client.active ? "default" : "secondary"}>
                        {client.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditClient(client)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => client.id && handleDeleteClient(client.id, client.name)}
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

          {!isLoading && clients.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum cliente encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {search ? "Tente ajustar os termos de busca" : "Comece adicionando seu primeiro cliente"}
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Cliente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Alignment Analysis View */}
      {viewMode === 'alignment' && (
        <Card>
          <CardHeader>
            <CardTitle>Análise de Alinhamento</CardTitle>
            <CardDescription>
              Análise detalhada do alinhamento financeiro dos clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {clients.map((client: Client) => (
                <div key={client.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">{client.name}</h3>
                      <p className="text-sm text-muted-foreground">{client.email}</p>
                    </div>
                    <Badge variant={
                      (client.alignmentPercentage || 0) >= 80 ? "default" :
                      (client.alignmentPercentage || 0) >= 60 ? "secondary" : "destructive"
                    }>
                      {client.alignmentPercentage || 0}% Alinhado
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Alinhamento Financeiro</span>
                      <span>{client.alignmentPercentage || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${client.alignmentPercentage || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Import View */}
      {viewMode === 'import' && (
        <Card>
          <CardHeader>
            <CardTitle>Importação de Dados</CardTitle>
            <CardDescription>
              Importe dados de clientes via CSV ou outras fontes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center p-8">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Plus className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">Funcionalidade em Desenvolvimento</h3>
              <p className="text-muted-foreground mb-4">
                A importação de dados será implementada em breve
              </p>
              <Button variant="outline">
                Solicitar Acesso Beta
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
