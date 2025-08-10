"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { DatePicker } from "@/components/ui/date-picker"
import { useClients, useCreateEvent, useUpdateEvent } from "@/hooks/use-api"
import { toast } from "sonner"

const eventSchema = z.object({
  clientId: z.string().min(1, "Cliente é obrigatório"),
  type: z.enum(["DEPOSIT", "WITHDRAWAL", "INCOME", "EXPENSE"], {
    message: "Tipo de evento é obrigatório"
  }),
  name: z.string().min(1, "Nome do evento é obrigatório"),
  description: z.string().optional(),
  value: z.number().positive("Valor deve ser positivo"),
  frequency: z.enum(["ONCE", "MONTHLY", "YEARLY"]),
  startDate: z.date({
    message: "Data de início é obrigatória"
  }),
  endDate: z.date().optional()
}).refine((data) => {
  // Se frequency não for ONCE, endDate deve estar presente
  if (data.frequency !== "ONCE" && !data.endDate) {
    return false
  }
  // Se endDate existe, deve ser posterior a startDate
  if (data.endDate && data.endDate <= data.startDate) {
    return false
  }
  return true
}, {
  message: "Para eventos recorrentes, a data de fim deve ser posterior à data de início",
  path: ["endDate"]
})

type EventFormData = z.infer<typeof eventSchema>

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

interface Event {
  id: string
  clientId: string
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'INCOME' | 'EXPENSE'
  name: string
  description?: string
  value: number
  frequency: 'ONCE' | 'MONTHLY' | 'YEARLY'
  startDate: string
  endDate?: string
}

interface EventFormProps {
  event?: Event | null
  onSuccess: () => void
  onCancel: () => void
}

const eventTypeOptions = [
  { value: "DEPOSIT", label: "Depósito", description: "Aporte de capital" },
  { value: "INCOME", label: "Receita", description: "Recebimento recorrente" },
  { value: "WITHDRAWAL", label: "Saque", description: "Retirada de capital" },
  { value: "EXPENSE", label: "Despesa", description: "Gasto recorrente" }
]

const frequencyOptions = [
  { value: "ONCE", label: "Única", description: "Evento pontual" },
  { value: "MONTHLY", label: "Mensal", description: "Repetir todo mês" },
  { value: "YEARLY", label: "Anual", description: "Repetir todo ano" }
]

export function EventForm({ event, onSuccess, onCancel }: EventFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { data: clientsData } = useClients(1, 100)
  const createEvent = useCreateEvent()
  const updateEvent = useUpdateEvent()

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      clientId: event?.clientId || "",
      type: event?.type || "DEPOSIT",
      name: event?.name || "",
      description: event?.description || "",
      value: event?.value || 0,
      frequency: event?.frequency || "ONCE",
      startDate: event?.startDate ? new Date(event.startDate) : new Date(),
      endDate: event?.endDate ? new Date(event.endDate) : undefined
    }
  })

  const clients: Client[] = (clientsData as ClientsResponse)?.clients || []

  const onSubmit = async (data: EventFormData) => {
    setIsSubmitting(true)
    
    try {
      const eventData = {
        ...data,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate?.toISOString()
      }

      if (event) {
        await updateEvent.mutateAsync({
          id: event.id,
          data: eventData
        })
      } else {
        await createEvent.mutateAsync(eventData)
      }
      
      onSuccess()
    } catch (error) {
      console.error("Erro ao salvar evento:", error)
      toast.error("Erro ao salvar evento")
    } finally {
      setIsSubmitting(false)
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

  const selectedType = form.watch("type")
  const selectedFrequency = form.watch("frequency")
  const selectedValue = form.watch("value")

  // Calcular impacto anual estimado
  const getAnnualImpact = () => {
    if (!selectedValue) return 0
    
    switch (selectedFrequency) {
      case "MONTHLY":
        return selectedValue * 12
      case "YEARLY":
        return selectedValue
      case "ONCE":
      default:
        return selectedValue
    }
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cliente */}
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} ({client.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tipo de Evento */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Evento</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {eventTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-sm text-muted-foreground">{option.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nome do Evento */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Evento</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: Salário mensal, Dividendos, Aposentadoria..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Valor */}
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor (R$)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Frequência */}
            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequência</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a frequência" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {frequencyOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-sm text-muted-foreground">{option.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Data de Início */}
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Início</FormLabel>
                  <FormControl>
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Selecione a data de início"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Data de Fim (condicional) */}
            {selectedFrequency !== 'ONCE' && (
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Fim</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Selecione a data de fim"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Descrição */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Descrição (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descrição adicional sobre o evento..."
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Preview do Impacto */}
          {selectedValue > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Impacto na Projeção</CardTitle>
                <CardDescription>
                  Como este evento afetará as projeções patrimoniais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Valor por Ocorrência</p>
                    <p className={`font-medium text-lg ${
                      (selectedType === 'DEPOSIT' || selectedType === 'INCOME') ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {(selectedType === 'DEPOSIT' || selectedType === 'INCOME') ? '+' : '-'}
                      {formatCurrency(selectedValue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Frequência</p>
                    <p className="font-medium text-lg">
                      {frequencyOptions.find(f => f.value === selectedFrequency)?.label}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Impacto Anual</p>
                    <p className={`font-medium text-lg ${
                      (selectedType === 'DEPOSIT' || selectedType === 'INCOME') ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {(selectedType === 'DEPOSIT' || selectedType === 'INCOME') ? '+' : '-'}
                      {formatCurrency(getAnnualImpact())}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tipo de Impacto</p>
                    <p className={`font-medium text-lg ${
                      (selectedType === 'DEPOSIT' || selectedType === 'INCOME') ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {(selectedType === 'DEPOSIT' || selectedType === 'INCOME') ? 'Positivo' : 'Negativo'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Alertas */}
          {selectedFrequency !== 'ONCE' && !form.watch("endDate") && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-yellow-800">
                  <span className="text-sm">⚠️ Para eventos recorrentes, é recomendado definir uma data de fim</span>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedValue > 50000 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-blue-800">
                  <span className="text-sm">ℹ️ Evento de alto valor - terá impacto significativo nas projeções</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botões */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Salvando..." : event ? "Atualizar" : "Criar"} Evento
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
