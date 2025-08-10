"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { goalSchema, type GoalFormData } from "@/lib/schemas"
import { useCreateGoal, useUpdateGoal, useClients } from "@/hooks/use-api"
import { Loader2, Save, X, Target } from "lucide-react"

interface Client {
  id: string
  name: string
  email: string
}

interface GoalFormProps {
  goal?: GoalFormData | {
    id?: string
    clientId: string
    type: "RETIREMENT" | "SHORT_TERM" | "MEDIUM_TERM" | "LONG_TERM" | "EDUCATION" | "TRAVEL" | "INVESTMENT" | "OTHER"
    name: string
    targetValue: number
    targetDate: string
    currentValue?: number
    description?: string
    monthlyIncome?: number
  }
  clientId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function GoalForm({ goal, clientId, onSuccess, onCancel }: GoalFormProps) {
  const isEditing = !!goal?.id
  const createGoal = useCreateGoal()
  const updateGoal = useUpdateGoal()
  const { data: clients } = useClients()

  const form = useForm({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: goal?.name || "",
      description: goal?.description || "",
      type: goal?.type || "RETIREMENT",
      clientId: goal?.clientId || clientId || "",
      targetValue: goal?.targetValue || 0,
      targetDate: goal?.targetDate || "",
      currentValue: goal?.currentValue || 0,
      monthlyIncome: goal?.monthlyIncome || 0,
    },
  })

  const onSubmit = async (data: GoalFormData) => {
    try {
      if (isEditing && goal?.id) {
        await updateGoal.mutateAsync({ id: goal.id, data })
      } else {
        await createGoal.mutateAsync({ ...data, priority: 'MEDIUM' })
      }
      onSuccess?.()
    } catch (error) {
      console.error("Erro ao salvar meta:", error)
    }
  }

  const isLoading = createGoal.isPending || updateGoal.isPending

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          {isEditing ? "Editar Meta" : "Nova Meta"}
        </CardTitle>
        <CardDescription>
          {isEditing 
            ? "Atualize as informações da meta financeira abaixo." 
            : "Defina uma nova meta financeira para acompanhamento."
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Meta</FormLabel>
                    <FormControl>
                      <Input placeholder="Aposentadoria aos 60 anos" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Meta</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="RETIREMENT">Aposentadoria</SelectItem>
                        <SelectItem value="SHORT_TERM">Curto Prazo</SelectItem>
                        <SelectItem value="MEDIUM_TERM">Médio Prazo</SelectItem>
                        <SelectItem value="LONG_TERM">Longo Prazo</SelectItem>
                        <SelectItem value="EDUCATION">Educação</SelectItem>
                        <SelectItem value="TRAVEL">Viagem</SelectItem>
                        <SelectItem value="INVESTMENT">Investimento</SelectItem>
                        <SelectItem value="OTHER">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!clientId && (
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
                          {(clients as { clients: Client[] })?.clients?.map((client: Client) => (
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
              )}

              <FormField
                control={form.control}
                name="targetValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Alvo (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="2500000" 
                        type="number" 
                        step="0.01"
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Valor total a ser atingido
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currentValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Atual (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="850000" 
                        type="number" 
                        step="0.01"
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Valor já acumulado para esta meta
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Alvo</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="2035-12-31" 
                        type="date"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Data prevista para atingir a meta
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="monthlyIncome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Renda Mensal Desejada (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="15000" 
                        type="number" 
                        step="0.01"
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Renda mensal esperada (aposentadoria)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva os detalhes e objetivos desta meta..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Informações adicionais sobre a meta e estratégia
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                {isEditing ? "Atualizar Meta" : "Criar Meta"}
              </Button>
              
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
