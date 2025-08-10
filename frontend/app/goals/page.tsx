"use client"

export const dynamic = 'force-dynamic'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GoalForm } from "@/components/forms/goal-form"
import { useGoals, useDeleteGoal, useClients } from "@/hooks/use-api"
import { 
  Plus, 
  Target, 
  Edit, 
  Trash2, 
  Eye,
  TrendingUp,
  Calendar,
  DollarSign,
  AlertTriangle
} from "lucide-react"
import { toast } from "sonner"

interface Client {
  id: string
  name: string
}

interface Goal {
  id: string
  name: string
  description?: string
  type: "RETIREMENT" | "SHORT_TERM" | "MEDIUM_TERM" | "LONG_TERM" | "EDUCATION" | "TRAVEL" | "INVESTMENT" | "OTHER"
  clientId: string
  targetValue: number
  currentValue?: number
  targetDate: string
  createdAt: string
  updatedAt: string
}

export default function GoalsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [selectedClientId, setSelectedClientId] = useState<string>("all")
  
  const { data: goalsData, isLoading, error } = useGoals(selectedClientId === "all" ? undefined : selectedClientId)
  const { data: clientsData } = useClients()
  const deleteGoal = useDeleteGoal()

  const handleDeleteGoal = async (goalId: string, goalName: string) => {
    if (confirm(`Tem certeza que deseja remover a meta "${goalName}"?`)) {
      try {
        await deleteGoal.mutateAsync(goalId)
      } catch (error) {
        console.error("Erro ao deletar meta:", error)
      }
    }
  }

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal)
    setIsDialogOpen(true)
  }

  const handleFormSuccess = () => {
    setIsDialogOpen(false)
    setEditingGoal(null)
    toast.success("Operação realizada com sucesso!")
  }

  const getGoalTypeBadge = (type: string) => {
    const typeMap = {
      RETIREMENT: { label: "Aposentadoria", variant: "default" as const },
      SHORT_TERM: { label: "Curto Prazo", variant: "secondary" as const },
      MEDIUM_TERM: { label: "Médio Prazo", variant: "outline" as const },
      LONG_TERM: { label: "Longo Prazo", variant: "outline" as const },
      EDUCATION: { label: "Educação", variant: "secondary" as const },
      TRAVEL: { label: "Viagem", variant: "outline" as const },
      INVESTMENT: { label: "Investimento", variant: "default" as const },
      OTHER: { label: "Outro", variant: "secondary" as const }
    }[type] || { label: type, variant: "outline" as const }

    return <Badge variant={typeMap.variant}>{typeMap.label}</Badge>
  }

  const getProgressPercentage = (current: number, target: number) => {
    return target > 0 ? Math.min((current / target) * 100, 100) : 0
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

  const isGoalNearTarget = (targetDate: string) => {
    const target = new Date(targetDate)
    const now = new Date()
    const diffTime = target.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 90 && diffDays > 0
  }

  const goals = goalsData?.data || []
  const totalGoals = goals.length
  const clients: Array<{ id: string; name: string }> = (
    (clientsData as { clients?: Array<{ id: string; name: string }> } | undefined)?.clients
  ) ?? []

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="p-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>Erro ao carregar metas. Verifique se o backend está rodando.</span>
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
          <h1 className="text-3xl font-bold tracking-tight">Metas Financeiras</h1>
          <p className="text-muted-foreground">
            Acompanhe o progresso das metas de seus clientes
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) setEditingGoal(null)
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Meta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingGoal ? "Editar Meta" : "Nova Meta"}
              </DialogTitle>
            </DialogHeader>
            <GoalForm 
              goal={editingGoal || undefined}
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
            <CardTitle className="text-sm font-medium">Total de Metas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGoals}</div>
            <p className="text-xs text-muted-foreground">
              Metas cadastradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total Alvo</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(goals.reduce((sum: number, goal: Goal) => sum + (goal.targetValue || 0), 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Soma de todas as metas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progresso Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {goals.length > 0 
                ? (goals.reduce((sum: number, goal: Goal) => sum + getProgressPercentage(goal.currentValue || 0, goal.targetValue), 0) / goals.length).toFixed(1)
                : "0"
              }%
            </div>
            <p className="text-xs text-muted-foreground">
              Média de progresso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Metas Próximas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {goals.filter((goal: Goal) => isGoalNearTarget(goal.targetDate)).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Vencem em 90 dias
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Metas</CardTitle>
          <CardDescription>
            Visualize e gerencie todas as metas financeiras
          </CardDescription>
          <div className="flex items-center space-x-2">
            <Select value={selectedClientId} onValueChange={setSelectedClientId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os clientes</SelectItem>
                {clients.map((client: Client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                  <TableHead>Meta</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Progresso</TableHead>
                  <TableHead>Valor Alvo</TableHead>
                  <TableHead>Data Alvo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {goals.map((goal: Goal) => {
                  const progress = getProgressPercentage(goal.currentValue || 0, goal.targetValue)
                  const isNearTarget = isGoalNearTarget(goal.targetDate)
                  
                  return (
                    <TableRow key={goal.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {goal.name}
                          {isNearTarget && (
                            <Badge variant="destructive" className="text-xs">
                              Próxima
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getGoalTypeBadge(goal.type)}</TableCell>
                      <TableCell>
                        {clients.find((c: Client) => c.id === goal.clientId)?.name || "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Progress value={progress} className="flex-1" />
                            <span className="text-sm font-medium w-12">
                              {progress.toFixed(0)}%
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatCurrency(goal.currentValue || 0)} / {formatCurrency(goal.targetValue)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(goal.targetValue)}</TableCell>
                      <TableCell>
                        <div className={isNearTarget ? "text-red-600 font-medium" : ""}>
                          {formatDate(goal.targetDate)}
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
                            onClick={() => handleEditGoal(goal)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteGoal(goal.id, goal.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}

          {!isLoading && goals.length === 0 && (
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma meta encontrada</h3>
              <p className="text-muted-foreground mb-4">
                {selectedClientId !== "all" ? "Este cliente não possui metas cadastradas" : "Comece adicionando a primeira meta"}
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Meta
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
