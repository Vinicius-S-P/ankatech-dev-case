"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { EventForm } from "@/components/forms/event-form"
import { useEvents, useDeleteEvent } from "@/hooks/use-api"
import { 
  Calendar,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Repeat,
  Clock,
  Users
} from "lucide-react"
import { toast } from "sonner"

interface Event {
  id: string
  clientId: string
  clientName?: string
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'INCOME' | 'EXPENSE'
  name: string
  description?: string
  value: number
  frequency: 'ONCE' | 'MONTHLY' | 'YEARLY'
  startDate: string
  endDate?: string
  lastProcessed?: string
  nextOccurrence?: string
  createdAt: string
  updatedAt: string
}

const eventTypeLabels = {
  DEPOSIT: 'Depósito',
  WITHDRAWAL: 'Saque',
  INCOME: 'Receita',
  EXPENSE: 'Despesa'
}

const eventTypeColors = {
  DEPOSIT: 'text-green-600 bg-green-50 border-green-200',
  INCOME: 'text-green-600 bg-green-50 border-green-200',
  WITHDRAWAL: 'text-red-600 bg-red-50 border-red-200',
  EXPENSE: 'text-red-600 bg-red-50 border-red-200'
}

const frequencyLabels = {
  ONCE: 'Única',
  MONTHLY: 'Mensal',
  YEARLY: 'Anual'
}

export default function EventsPage() {
  const [search, setSearch] = useState("")
  const [selectedClient, setSelectedClient] = useState<string>("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  
  const { data: eventsData, isLoading, error } = useEvents(selectedClient)
  const deleteEvent = useDeleteEvent()

  const handleDeleteEvent = async (eventId: string, eventName: string) => {
    if (confirm(`Tem certeza que deseja remover o evento "${eventName}"?`)) {
      try {
        await deleteEvent.mutateAsync(eventId)
        toast.success("Evento removido com sucesso!")
      } catch (error) {
        console.error("Erro ao deletar evento:", error)
        toast.error("Erro ao remover evento")
      }
    }
  }

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event)
    setIsDialogOpen(true)
  }

  const handleFormSuccess = () => {
    setIsDialogOpen(false)
    setEditingEvent(null)
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

  const events = eventsData?.data || []

  // Filtrar eventos por busca
  const filteredEvents = events.filter((event: Event) => 
    event.name.toLowerCase().includes(search.toLowerCase()) ||
    event.clientName?.toLowerCase().includes(search.toLowerCase()) ||
    eventTypeLabels[event.type].toLowerCase().includes(search.toLowerCase())
  )

  // Cálculos para estatísticas
  const totalPositive = filteredEvents
    .filter((e: Event) => e.type === 'DEPOSIT' || e.type === 'INCOME')
    .reduce((sum: number, e: Event) => sum + e.value, 0)

  const totalNegative = filteredEvents
    .filter((e: Event) => e.type === 'WITHDRAWAL' || e.type === 'EXPENSE')
    .reduce((sum: number, e: Event) => sum + e.value, 0)

  const netFlow = totalPositive - totalNegative

  const recurringEvents = filteredEvents.filter((e: Event) => e.frequency !== 'ONCE').length
  const uniqueClients = new Set(filteredEvents.map((e: Event) => e.clientId)).size

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="p-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>Erro ao carregar eventos. Verifique se o backend está rodando.</span>
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
          <h1 className="text-3xl font-bold tracking-tight">Eventos Financeiros</h1>
          <p className="text-muted-foreground">
            Gerencie eventos que impactam as projeções patrimoniais
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) setEditingEvent(null)
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Evento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEvent ? "Editar Evento" : "Novo Evento"}
              </DialogTitle>
            </DialogHeader>
            <EventForm 
              event={editingEvent}
              onSuccess={handleFormSuccess}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Client Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtro por Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Digite o ID do cliente para filtrar eventos..."
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredEvents.length}</div>
            <p className="text-xs text-muted-foreground">
              {recurringEvents} recorrentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entradas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPositive)}</div>
            <p className="text-xs text-muted-foreground">
              Depósitos + Receitas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saídas</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalNegative)}</div>
            <p className="text-xs text-muted-foreground">
              Saques + Despesas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fluxo Líquido</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(netFlow)}
            </div>
            <p className="text-xs text-muted-foreground">
              {uniqueClients} clientes únicos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Eventos</CardTitle>
          <CardDescription>
            Eventos que afetam as projeções patrimoniais
          </CardDescription>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar eventos..."
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
                  <TableHead>Nome</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Frequência</TableHead>
                  <TableHead>Data Início</TableHead>
                  <TableHead>Próxima Ocorrência</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event: Event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        className={eventTypeColors[event.type]}
                      >
                        <div className="flex items-center gap-1">
                          {(event.type === 'DEPOSIT' || event.type === 'INCOME') ? 
                            <TrendingUp className="h-3 w-3" /> : 
                            <TrendingDown className="h-3 w-3" />
                          }
                          {eventTypeLabels[event.type]}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>
                        <div>{event.name}</div>
                        {event.description && (
                          <div className="text-sm text-muted-foreground">{event.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{event.clientName || event.clientId}</TableCell>
                    <TableCell>
                      <span className={`font-medium ${
                        (event.type === 'DEPOSIT' || event.type === 'INCOME') ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {(event.type === 'DEPOSIT' || event.type === 'INCOME') ? '+' : '-'}
                        {formatCurrency(event.value)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {event.frequency === 'ONCE' ? <Clock className="h-3 w-3" /> : <Repeat className="h-3 w-3" />}
                        {frequencyLabels[event.frequency]}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(event.startDate)}</TableCell>
                    <TableCell>
                      {event.nextOccurrence ? formatDate(event.nextOccurrence) : "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditEvent(event)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteEvent(event.id, event.name)}
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

          {!isLoading && filteredEvents.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum evento encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {search || selectedClient ? "Tente ajustar os filtros de busca" : "Comece adicionando seu primeiro evento"}
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Evento
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Impact Alert */}
      {filteredEvents.length > 0 && (
        <Alert>
          <TrendingUp className="h-4 w-4" />
          <AlertDescription>
            <strong>Impacto na Projeção:</strong> Os eventos cadastrados afetarão automaticamente 
            as projeções patrimoniais no simulador. Events recorrentes são processados mensalmente/anualmente 
            conforme configurado.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
