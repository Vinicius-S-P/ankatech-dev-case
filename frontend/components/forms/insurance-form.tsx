"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { DatePicker } from "@/components/ui/date-picker"
import { useClients, useCreateInsurance, useUpdateInsurance } from "@/hooks/use-api"
import { toast } from "sonner"

const insuranceSchema = z.object({
  clientId: z.string().min(1, "Cliente é obrigatório"),
  type: z.enum(["LIFE", "DISABILITY", "HEALTH", "PROPERTY"], {
    message: "Tipo de seguro é obrigatório"
  }),
  provider: z.string().min(1, "Provedor é obrigatório"),
  policyNumber: z.string().optional(),
  coverage: z.number().positive("Cobertura deve ser positiva"),
  premium: z.number().positive("Prêmio deve ser positivo"),
  premiumFrequency: z.enum(["MONTHLY", "YEARLY", "ONCE"]),
  startDate: z.date({
    message: "Data de início é obrigatória"
  }),
  endDate: z.date().optional()
})

type InsuranceFormData = z.infer<typeof insuranceSchema>

interface Insurance {
  id: string
  clientId: string
  type: 'LIFE' | 'DISABILITY' | 'HEALTH' | 'PROPERTY'
  provider: string
  policyNumber?: string
  coverage: number
  premium: number
  premiumFrequency: 'MONTHLY' | 'YEARLY' | 'ONCE'
  startDate: string
  endDate?: string
}

interface InsuranceFormProps {
  insurance?: Insurance | null
  onSuccess: () => void
  onCancel: () => void
}

const insuranceTypeOptions = [
  { value: "LIFE", label: "Vida" },
  { value: "DISABILITY", label: "Invalidez" },
  { value: "HEALTH", label: "Saúde" },
  { value: "PROPERTY", label: "Patrimonial" }
]

const frequencyOptions = [
  { value: "MONTHLY", label: "Mensal" },
  { value: "YEARLY", label: "Anual" },
  { value: "ONCE", label: "Pagamento único" }
]

export function InsuranceForm({ insurance, onSuccess, onCancel }: InsuranceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { data: clientsData } = useClients(1, 100)
  const createInsurance = useCreateInsurance()
  const updateInsurance = useUpdateInsurance()

  const form = useForm<InsuranceFormData>({
    resolver: zodResolver(insuranceSchema),
    defaultValues: {
      clientId: insurance?.clientId || "",
      type: insurance?.type || "LIFE",
      provider: insurance?.provider || "",
      policyNumber: insurance?.policyNumber || "",
      coverage: insurance?.coverage || 0,
      premium: insurance?.premium || 0,
      premiumFrequency: insurance?.premiumFrequency || "MONTHLY",
      startDate: insurance?.startDate ? new Date(insurance.startDate) : new Date(),
      endDate: insurance?.endDate ? new Date(insurance.endDate) : undefined
    }
  })

  const clients = (clientsData as { clients: { id: string; name: string; email: string }[] })?.clients || []

  const onSubmit = async (data: InsuranceFormData) => {
    setIsSubmitting(true)
    
    try {
      const insuranceData = {
        ...data,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate?.toISOString()
      }

      if (insurance) {
        await updateInsurance.mutateAsync({
          id: insurance.id,
          data: insuranceData
        })
      } else {
        await createInsurance.mutateAsync(insuranceData)
      }
      
      onSuccess()
    } catch (error) {
      console.error("Erro ao salvar seguro:", error)
      toast.error("Erro ao salvar seguro")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      {clients.map((client: { id: string; name: string; email: string }) => (
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

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Seguro</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {insuranceTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
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
              name="provider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Provedor/Seguradora</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: Bradesco Seguros" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="policyNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número da Apólice (Opcional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: 123456789" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="coverage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor da Cobertura (R$)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="premium"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor do Prêmio (R$)</FormLabel>
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

            <FormField
              control={form.control}
              name="premiumFrequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequência do Prêmio</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a frequência" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {frequencyOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
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

            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Fim (Opcional)</FormLabel>
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
          </div>

          {form.watch("coverage") > 0 && form.watch("premium") > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Resumo da Apólice</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Cobertura</p>
                    <p className="font-medium">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        minimumFractionDigits: 0
                      }).format(form.watch("coverage"))}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Prêmio {form.watch("premiumFrequency") === 'MONTHLY' ? 'Mensal' : form.watch("premiumFrequency") === 'YEARLY' ? 'Anual' : 'Único'}</p>
                    <p className="font-medium">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(form.watch("premium"))}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Custo Anual</p>
                    <p className="font-medium">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(
                        form.watch("premiumFrequency") === 'MONTHLY' 
                          ? form.watch("premium") * 12 
                          : form.watch("premium")
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Custo vs Cobertura</p>
                    <p className="font-medium">
                      {(
                        (form.watch("premiumFrequency") === 'MONTHLY' 
                          ? form.watch("premium") * 12 
                          : form.watch("premium")
                        ) / form.watch("coverage") * 100
                      ).toFixed(2)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
              {isSubmitting ? "Salvando..." : insurance ? "Atualizar" : "Criar"} Apólice
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
