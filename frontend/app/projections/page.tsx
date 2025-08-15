"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { useForm, type Resolver, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer} from 'recharts'

import { projectionSchema, type ProjectionFormData } from "@/lib/schemas"
import { ProjectionData } from "@/lib/api-client"
import { useClients, useWealthProjection, useEvents, useInsurances } from "@/hooks/use-api"
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Loader2,
  ChevronDown,
  ShieldCheck
} from "lucide-react"
import { toast } from "sonner"
import { ChartContainer } from "@/components/ui/chart"

interface Client {
  id: string
  name: string
}

interface ProjectionResult {
  year: number
  startValue: number
  endValue: number
  contribution: number
  withdrawal: number
  growth: number
  events: Array<{
    type: string
    value: number
    description: string
  }>
  totalGoalProgress: number
}

interface ProjectionResults {
  projections: ProjectionResult[]
}

interface Event {
  id: string
  clientId: string
  client?: Client // Optional as it might not be included in all fetches
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

interface Insurance {
  id: string;
  clientId: string;
  type: 'LIFE' | 'HEALTH' | 'DISABILITY' | 'PROPERTY' | 'OTHER';
  provider: string;
  coverage: number;
  premium: number;
  frequency: 'ONCE' | 'MONTHLY' | 'YEARLY';
  startDate: string;
  endDate?: string;
}

const eventTypeLabels = {
  DEPOSIT: 'Depósito',
  WITHDRAWAL: 'Saque',
  INCOME: 'Receita',
  EXPENSE: 'Despesa'
}

const insuranceTypeLabels = {
  LIFE: 'Vida',
  HEALTH: 'Saúde',
  DISABILITY: 'Invalidez',
  PROPERTY: 'Propriedade',
  OTHER: 'Outro'
}

const frequencyLabels = {
  ONCE: 'Única',
  MONTHLY: 'Mensal',
  YEARLY: 'Anual'
}

export default function ProjectionsPage() {
  const [projectionResults, setProjectionResults] = useState<ProjectionResults | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(true)
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart")
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>(undefined)
  const { data: clientsData } = useClients()
  const wealthProjection = useWealthProjection()
  const { data: eventsData } = useEvents(selectedClientId)
  const { data: insurancesData } = useInsurances(selectedClientId)

  const form = useForm<ProjectionFormData>({
    resolver: zodResolver(projectionSchema) as unknown as Resolver<ProjectionFormData>,
    defaultValues: {
      startYear: new Date().getFullYear(),
      targetYear: 2060,
      annualReturn: 4,
      includeEvents: true,
    },
  })

  useEffect(() => {
    if (clientsData?.clients && clientsData.clients.length > 0 && !selectedClientId) {
      setSelectedClientId(clientsData.clients[0].id)
      form.setValue("clientId", clientsData.clients[0].id)
    }
  }, [clientsData, selectedClientId, form])

  const onSubmit: SubmitHandler<ProjectionFormData> = async (data) => {
    try {
      setIsCalculating(true)
      
      const payload: ProjectionData = {
        clientId: selectedClientId,
        startYear: data.startYear,
        realRate: data.annualReturn / 100,
        endYear: data.targetYear,
        includeEvents: data.includeEvents,
      }

      const result = await wealthProjection.mutateAsync(payload)
      setProjectionResults({ projections: result.projections })
      setIsFormOpen(false)
      
      toast.success("Projeção calculada com sucesso!")
    } catch (error) {
      console.error("Erro ao calcular projeção:", error)
      toast.error("Erro ao calcular projeção.")
    } finally {
      setIsCalculating(false)
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

  const formatCurrencyAbbreviated = (value: number) => {
    if (value >= 1e12) {
      return `R$ ${(value / 1e12).toFixed(1)}T`
    }
    if (value >= 1e9) {
      return `R$ ${(value / 1e9).toFixed(1)}B`
    }
    if (value >= 1e6) {
      return `R$ ${(value / 1e6).toFixed(1)}M`
    }
    if (value >= 1e3) {
      return `R$ ${(value / 1e3).toFixed(1)}K`
    }
    return `R$ ${value}`
  }

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId)
    setProjectionResults(null)
    form.reset({
      targetYear: 2060,
      annualReturn: 4,
      startYear: new Date().getFullYear(),
      includeEvents: true,
    })
  }

  const calculateDurationInYears = (startDate: string, endDate?: string): string => {
    if (!endDate) return "N/A";
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffInMs = end.getTime() - start.getTime();
    const diffInYears = diffInMs / (1000 * 60 * 60 * 24 * 365.25);
    return `${Math.round(diffInYears)} anos`;
  };

  const clients: Array<{ id: string; name: string }> = (
    (clientsData as { clients?: Array<{ id: string; name: string }> })?.clients
  ) ?? []
  const projections = projectionResults?.projections || []
  return (
    <div className="space-y-6">
      <div className="w-full">
        <Select onValueChange={handleClientChange} defaultValue={selectedClientId}>
          <SelectTrigger className="w-[650px] text-3xl font-bold tracking-tight rounded-full">
            <SelectValue placeholder="Selecione um cliente" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client: Client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Projeção Patrimonial</h1>
        <p className="text-muted-foreground">
          Calcule projeções patrimoniais até 2060 com diferentes cenários
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Formulário de Simulação */}
        {!projectionResults && (
          <Collapsible open={isFormOpen} onOpenChange={setIsFormOpen} className="space-y-2">
            <CollapsibleTrigger asChild>
              <Card className="cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Parâmetros da Simulação
                  </CardTitle>
                  <ChevronDown className={`h-5 w-5 transition-transform ${isFormOpen ? 'rotate-180' : 'rotate-0'}`} />
                </CardHeader>
                <CardDescription className="px-6 pb-4">
                  Configure os parâmetros para calcular a projeção patrimonial
                </CardDescription>
              </Card>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Card>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                      

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
                                placeholder="2060" 
                                type="number" 
                                min="2024"
                                max="2060"
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 2060)}
                              />
                            </FormControl>
                            <FormDescription>
                              Ano final da projeção (até 2060)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="startYear"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ano de Início</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder={new Date().getFullYear().toString()} 
                                type="number" 
                                min="1900"
                                max="2100"
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value) || new Date().getFullYear())}
                              />
                            </FormControl>
                            <FormDescription>
                              Ano de início da projeção (padrão: ano atual)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="includeEvents"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                Incluir Eventos Financeiros
                              </FormLabel>
                              <FormDescription>
                                Considerar depósitos, saques, receitas e despesas na projeção.
                              </FormDescription>
                            </div>
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
            </CollapsibleContent>
          </Collapsible>
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
              {/* <div className="flex items-center justify-center gap-2 text-sm text-yellow-600">
                <AlertTriangle className="h-4 w-4" />
                <span>Demonstração com dados simulados (backend em desenvolvimento)</span>
              </div> */}
            </CardContent>
          </Card>
        )}
      </div>

      {projectionResults && (
        <div className="flex flex-col gap-6">
          <div className="flex justify-end">
            <Button onClick={() => setViewMode(viewMode === "chart" ? "table" : "chart")}>
              {viewMode === "chart" ? "Ver como tabela" : "Ver como gráfico"}
            </Button>
          </div>

          {viewMode === "chart" ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Gráfico de Projeção Patrimonial
                </CardTitle>
                <CardDescription>
                  Evolução do patrimônio ao longo dos anos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    projectedValue: { label: "Patrimônio Projetado", color: "var(--chart-blue)" },
                    totalGoalProgress: { label: "Progresso de Metas", color: "var(--chart-red)" },
                  }}
                  className="aspect-video h-[300px] w-full"
                >
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                    data={projections}                                                                                                                                                                                              
                    margin={{                                                                                                                                                                                                       
                      top: 5,                                                                                                                                                                                                       
                      right: 10,                                                                                                                                                                                                    
                      left: 10,                                                                                                                                                                                                     
                      bottom: 0,                                                                                                                                                                                                    
                    }}                                                                                                                                                                                                              
                  >                                                                                                                                                                                                                 
                    <CartesianGrid vertical={false} />                                                                                                                                                                              
                    <XAxis                                                                                                                                                                                                          
                      dataKey="year"                                                                                                                                                                                                
                      tickLine={false}                                                                                                                                                                                              
                      axisLine={false}                                                                                                                                                                                              
                      tickMargin={8}                                                                                                                                                                                                
                      minTickGap={80}                                                                                                                                                                                               
                      tickFormatter={(value) => value.toString()}                                                                                                                                                                   
                    />                                                                                                                                                                                                              
                    <YAxis                                                                                                                                                                                                          
                      tickLine={false}                                                                                                                                                                                              
                      axisLine={false}                                                                                                                                                                                              
                      tickFormatter={(value) => formatCurrencyAbbreviated(value)}                                                                                                                                                   
                    />                                                                                                                                                                                                              
                    <Line                                                                                                                                                                                                           
                      type="monotone"                                                                                                                                                                                               
                      dataKey="endValue"                                                                                                                                                                                            
                      stroke="var(--color-projectedValue)"                                                                                                                                                                          
                      strokeWidth={2}                                                                                                                                                                                               
                      dot={false}                                                                                                                                                                                                   
                    />                                                                                                                                                                                                              
                    <Line                                                                                                                                                                                                           
                      type="monotone"                                                                                                                                                                                               
                      dataKey="totalGoalProgress"                                                                                                                                                                                   
                      stroke="var(--color-totalGoalProgress)"                                                                                                                                                                       
                      strokeWidth={2}                                                                                                                                                                                               
                      dot={false}                                                                                                                                                                                                   
                    />                                                                                                                                                                                                              
                  </LineChart>                                                                                                                                                                                                      
                </ResponsiveContainer> 
                </ChartContainer>
              </CardContent>
            </Card>
          ) : (
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
                      <TableHead>Patrimônio Final</TableHead>
                      <TableHead>Contribuições Acumuladas</TableHead>
                      <TableHead>Crescimento</TableHead>
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
                          {formatCurrency(projection.endValue)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(projection.contribution)}
                        </TableCell>
                        <TableCell className="text-blue-600">
                          {formatCurrency(projection.growth)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Resultados Resumidos */}
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
                    {formatCurrency(projections[projections.length - 1]?.endValue || 0)}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground"> Investido</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(projections[0]?.startValue + (projections[projections.length - 1]?.contribution || 0))}
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

          {selectedClientId && eventsData?.events && eventsData.events.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold" style={{ color: 'var(--chart-blue)' }}>Movimentações</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {eventsData.events.map((event: Event, index: number) => (
                  <Card key={event.id || index} className="bg-zinc-800 border-2" style={{ borderColor: 'var(--chart-blue) !important' }}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-white">{event.name}</h3>
                          <p className="text-sm text-gray-400">
                            Início: {new Date(event.startDate).toLocaleDateString('pt-BR')}
                          </p>
                          <p className="text-sm text-gray-400">
                            Frequência: {frequencyLabels[event.frequency]}
                          </p>
                          <p className="text-sm text-gray-400">
                            Tipo: {eventTypeLabels[event.type]}
                          </p>
                        </div>
                        <div className={`text-lg font-bold ${event.type == "EXPENSE" || event.type == "WITHDRAWAL" ? 'text-red-500' : 'text-green-500' }`}>
                          {event.type == "EXPENSE" || event.type == "WITHDRAWAL" ? <TrendingDown className="inline-block mr-1" /> : <TrendingUp className="inline-block mr-1" />}
                          {formatCurrency(event.value)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {selectedClientId && insurancesData?.insurance && insurancesData.insurance.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold" style={{ color: 'var(--chart-blue)' }}>Seguros</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insurancesData.insurance.map((insurance: Insurance, index: number) => (
                  <Card key={insurance.id || index} className="bg-zinc-800 border-2" style={{ borderColor: '#4B0082 !important' }}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-white">{insuranceTypeLabels[insurance.type]}</h3>
                          <p className="text-sm text-gray-400">
                            Duração: {calculateDurationInYears(insurance.startDate, insurance.endDate)}
                          </p>
                          <p className="text-sm text-gray-400">
                            Prêmio: {formatCurrency(insurance.premium)} {frequencyLabels[insurance.frequency]}
                          </p>
                        </div>
                        <div className={`text-lg font-bold text-purple-400`}>
                          <ShieldCheck className="inline-block mr-1" />
                          {formatCurrency(insurance.coverage)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}