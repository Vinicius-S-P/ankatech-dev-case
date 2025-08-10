"use client"

export const dynamic = 'force-dynamic'

import { useState } from "react"
import { useForm, type Resolver, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

import { projectionSchema, type ProjectionFormData } from "@/lib/schemas"
import { useClients } from "@/hooks/use-api"
import { 
  Calculator, 
  TrendingUp, 

  BarChart3,
  AlertTriangle,
  Loader2
} from "lucide-react"
import { toast } from "sonner"

interface Client {
  id: string
  name: string
}

interface ProjectionResult {
  year: number
  projectedValue: number
  monthlyIncome: number
  contribution: number
  growth: number
}

interface ProjectionResults {
  projections: ProjectionResult[]
}

export default function ProjectionsPage() {
  const [projectionResults, setProjectionResults] = useState<ProjectionResults | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  
  const { data: clientsData } = useClients()

  const form = useForm<ProjectionFormData>({
    resolver: zodResolver(projectionSchema) as unknown as Resolver<ProjectionFormData>,
    defaultValues: {
      clientId: "generic",
      initialWealth: 1000000,
      targetYear: 2040,
      annualReturn: 4,
      monthlyContribution: 5000,
    },
  })

  const onSubmit: SubmitHandler<ProjectionFormData> = async (data) => {
    try {
      setIsCalculating(true)
      
      // Simular dados de projeção já que o backend pode não estar disponível
      const mockResults = generateMockProjection(data)
      setProjectionResults(mockResults)
      
      // Comentado para demonstração - integração real com backend
      // const result = await wealthProjection.mutateAsync(data)
      // setProjectionResults(result)
      
      toast.success("Projeção calculada com sucesso!")
    } catch (error) {
      console.error("Erro ao calcular projeção:", error)
      toast.error("Erro ao calcular projeção. Usando dados simulados.")
      
      // Fallback para dados simulados
      const mockResults = generateMockProjection(data)
      setProjectionResults(mockResults)
    } finally {
      setIsCalculating(false)
    }
  }

  const generateMockProjection = (data: ProjectionFormData) => {
    const years = data.targetYear - new Date().getFullYear()
    const monthlyReturn = data.annualReturn / 100 / 12
    const results = []
    
    let currentValue = data.initialWealth
    const currentYear = new Date().getFullYear()
    
    for (let i = 0; i <= years; i++) {
      if (i > 0) {
        // Crescimento composto mensal
        for (let month = 0; month < 12; month++) {
          currentValue = currentValue * (1 + monthlyReturn) + data.monthlyContribution
        }
      }
      
      results.push({
        year: currentYear + i,
        projectedValue: Math.round(currentValue),
        monthlyIncome: Math.round(currentValue * 0.005), // 0.5% ao mês de renda
        contribution: data.monthlyContribution * 12 * i,
        growth: Math.round(currentValue - data.initialWealth - (data.monthlyContribution * 12 * i))
      })
    }
    
    return { projections: results }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const clients: Array<{ id: string; name: string }> = (
    (clientsData as { clients?: Array<{ id: string; name: string }> })?.clients
  ) ?? []
  const projections = projectionResults?.projections || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Projeção Patrimonial</h1>
        <p className="text-muted-foreground">
          Calcule projeções patrimoniais até 2060 com diferentes cenários
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Formulário de Simulação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Parâmetros da Simulação
            </CardTitle>
            <CardDescription>
              Configure os parâmetros para calcular a projeção patrimonial
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente (Opcional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um cliente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="generic">Simulação Genérica</SelectItem>
                          {clients.map((client: Client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="initialWealth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Patrimônio Inicial (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="1000000" 
                          type="number" 
                          step="1000"
                          {...field} 
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Valor atual do patrimônio
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="monthlyContribution"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contribuição Mensal (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="5000" 
                          type="number" 
                          step="100"
                          {...field} 
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Valor mensal a ser investido
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="annualReturn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taxa de Retorno Anual (%)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="4" 
                          type="number" 
                          step="0.1"
                          min="0"
                          max="30"
                          {...field} 
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Taxa real de retorno anual esperada
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="targetYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ano Alvo</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="2040" 
                          type="number" 
                          min="2024"
                          max="2060"
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 2040)}
                        />
                      </FormControl>
                      <FormDescription>
                        Ano final da projeção (até 2060)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isCalculating} className="w-full">
                  {isCalculating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Calculator className="mr-2 h-4 w-4" />
                  Calcular Projeção
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Resultados Resumidos */}
        {projectionResults && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Resumo da Projeção
              </CardTitle>
              <CardDescription>
                Principais métricas da simulação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Patrimônio Final</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(projections[projections.length - 1]?.projectedValue || 0)}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Renda Mensal Estimada</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(projections[projections.length - 1]?.monthlyIncome || 0)}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Investido</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(form.getValues("initialWealth") + (projections[projections.length - 1]?.contribution || 0))}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Crescimento</p>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(projections[projections.length - 1]?.growth || 0)}
                  </p>
                </div>
              </div>

              <div className="pt-4">
                <Badge variant="outline" className="text-sm">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  Projeção calculada com taxa de {form.getValues("annualReturn")}% a.a.
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabela de Projeção Detalhada */}
      {projectionResults && (
        <Card>
          <CardHeader>
            <CardTitle>Projeção Ano a Ano</CardTitle>
            <CardDescription>
              Evolução patrimonial detalhada até {form.getValues("targetYear")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ano</TableHead>
                  <TableHead>Patrimônio Projetado</TableHead>
                  <TableHead>Contribuições Acumuladas</TableHead>
                  <TableHead>Crescimento</TableHead>
                  <TableHead>Renda Mensal Estimada</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projections.map((projection: ProjectionResult, index: number) => (
                  <TableRow key={projection.year}>
                    <TableCell className="font-medium">
                      {projection.year}
                      {index === 0 && (
                        <Badge variant="outline" className="ml-2 text-xs">Atual</Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold text-green-600">
                      {formatCurrency(projection.projectedValue)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(projection.contribution)}
                    </TableCell>
                    <TableCell className="text-blue-600">
                      {formatCurrency(projection.growth)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(projection.monthlyIncome)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Estado inicial */}
      {!projectionResults && (
        <Card className="text-center py-12">
          <CardContent>
            <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Simulador de Projeções</h3>
            <p className="text-muted-foreground mb-4">
              Configure os parâmetros acima e clique em &quot;Calcular Projeção&quot; para ver a evolução patrimonial
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-yellow-600">
              <AlertTriangle className="h-4 w-4" />
              <span>Demonstração com dados simulados (backend em desenvolvimento)</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
