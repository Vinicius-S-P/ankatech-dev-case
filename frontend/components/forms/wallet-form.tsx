"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useClients, useCreateWallet, useUpdateWallet } from "@/hooks/use-api"
import { toast } from "sonner"

const walletSchema = z.object({
  clientId: z.string().min(1, "Cliente é obrigatório"),
  assetClass: z.enum(["STOCKS", "BONDS", "REAL_ESTATE", "COMMODITIES", "CASH", "CRYPTO", "PRIVATE_EQUITY", "OTHER"], {
    message: "Classe de ativo é obrigatória"
  }),
  description: z.string().optional(),
  currentValue: z.number().positive("Valor deve ser positivo"),
  percentage: z.number().min(0).max(100, "Percentual deve estar entre 0 e 100"),
  targetPercentage: z.number().min(0).max(100, "Percentual alvo deve estar entre 0 e 100").optional()
})

type WalletFormData = z.infer<typeof walletSchema>

interface WalletData {
  id: string
  clientId: string
  assetClass: 'STOCKS' | 'BONDS' | 'REAL_ESTATE' | 'COMMODITIES' | 'CASH' | 'CRYPTO' | 'PRIVATE_EQUITY' | 'OTHER'
  description?: string
  currentValue: number
  percentage: number
  targetPercentage?: number
}

interface WalletFormProps {
  wallet?: WalletData | null
  onSuccess: () => void
  onCancel: () => void
}

const assetClassOptions = [
  { value: "STOCKS", label: "Ações" },
  { value: "BONDS", label: "Renda Fixa" },
  { value: "REAL_ESTATE", label: "Fundos Imobiliários" },
  { value: "COMMODITIES", label: "Commodities" },
  { value: "CASH", label: "Caixa" },
  { value: "CRYPTO", label: "Criptomoedas" },
  { value: "PRIVATE_EQUITY", label: "Private Equity" },
  { value: "OTHER", label: "Outros" }
]

export function WalletForm({ wallet, onSuccess, onCancel }: WalletFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { data: clientsData } = useClients(1, 100)
  const createWallet = useCreateWallet()
  const updateWallet = useUpdateWallet()

  const form = useForm<WalletFormData>({
    resolver: zodResolver(walletSchema),
    defaultValues: {
      clientId: wallet?.clientId || "",
      assetClass: wallet?.assetClass || "STOCKS",
      description: wallet?.description || "",
      currentValue: wallet?.currentValue || 0,
      percentage: wallet?.percentage || 0,
      targetPercentage: wallet?.targetPercentage || 0
    }
  })

  const clients = (clientsData as { clients: { id: string; name: string; email: string }[] })?.clients || []

  const onSubmit = async (data: WalletFormData) => {
    setIsSubmitting(true)
    
    try {
      if (wallet) {
        await updateWallet.mutateAsync({
          id: wallet.id,
          data
        })
      } else {
        await createWallet.mutateAsync(data)
      }
      
      onSuccess()
    } catch (error) {
      console.error("Erro ao salvar posição:", error)
      toast.error("Erro ao salvar posição")
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

            {/* Classe de Ativo */}
            <FormField
              control={form.control}
              name="assetClass"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Classe de Ativo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a classe" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {assetClassOptions.map((option) => (
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

            {/* Valor Atual */}
            <FormField
              control={form.control}
              name="currentValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Atual (R$)</FormLabel>
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

            {/* Percentual Atual */}
            <FormField
              control={form.control}
              name="percentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Percentual do Portfólio (%)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.1"
                      min="0"
                      max="100"
                      placeholder="0.0"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Percentual Alvo */}
            <FormField
              control={form.control}
              name="targetPercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Percentual Alvo (%) - Opcional</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.1"
                      min="0"
                      max="100"
                      placeholder="0.0"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Descrição */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Descrição (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Ex: ITUB4 - 1000 ações, PETR4 - 500 ações..."
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Resumo */}
          {form.watch("currentValue") > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Resumo da Posição</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Valor Atual</p>
                    <p className="font-medium text-lg">
                      {formatCurrency(form.watch("currentValue"))}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">% Portfólio</p>
                    <p className="font-medium text-lg">
                      {form.watch("percentage").toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">% Alvo</p>
                    <p className="font-medium text-lg">
                      {(form.watch("targetPercentage") || 0).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Desvio</p>
                    <p className={`font-medium text-lg ${
                      Math.abs(form.watch("percentage") - (form.watch("targetPercentage") || 0)) > 5 
                        ? 'text-red-600' 
                        : 'text-green-600'
                    }`}>
                      {form.watch("targetPercentage") 
                        ? `${(form.watch("percentage") - form.watch("targetPercentage")!).toFixed(1)}%`
                        : "N/A"
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Alertas de Validação */}
          {form.watch("percentage") > 50 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-yellow-800">
                  <span className="text-sm">⚠️ Concentração alta em uma única classe de ativo ({form.watch("percentage").toFixed(1)}%)</span>
                </div>
              </CardContent>
            </Card>
          )}

          {form.watch("targetPercentage") && Math.abs(form.watch("percentage") - form.watch("targetPercentage")!) > 10 && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-800">
                  <span className="text-sm">🚨 Grande desvio da alocação alvo ({Math.abs(form.watch("percentage") - form.watch("targetPercentage")!).toFixed(1)}% de diferença)</span>
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
              {isSubmitting ? "Salvando..." : wallet ? "Atualizar" : "Criar"} Posição
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
