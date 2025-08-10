"use client"

import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { clientSchema, type ClientFormData } from "@/lib/schemas"
import { useCreateClient, useUpdateClient, useAuth } from "@/hooks/use-api"
import { Loader2, Save, X } from "lucide-react"
import { toast } from "sonner"

interface ClientFormProps {
  client?: ClientFormData
  onSuccess?: () => void
  onCancel?: () => void
}

export function ClientForm({ client, onSuccess, onCancel }: ClientFormProps) {
  const isEditing = !!client?.id
  const createClient = useCreateClient()
  const updateClient = useUpdateClient()
  const { getUser } = useAuth()
  const user = getUser()

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema) as unknown as Resolver<ClientFormData>,
    defaultValues: {
      name: client?.name || "",
      email: client?.email || "",
      age: client?.age || 25,
      active: client?.active ?? true,
      familyProfile: client?.familyProfile || "",
      advisorId: client?.advisorId || user?.id || "",
      totalWealth: client?.totalWealth || 0,
      alignmentPercentage: client?.alignmentPercentage || 0,
      alignmentCategory: client?.alignmentCategory || "MEDIUM_HIGH",
    },
  })

  const onSubmit = async (data: ClientFormData) => {
    try {
      console.log('Iniciando envio do formulário:', data)
      
      // Garantir que advisorId está preenchido
      const advisorId = data.advisorId || user?.id
      
      if (!advisorId) {
        console.error("Advisor ID não encontrado")
        toast.error("Erro: ID do advisor não encontrado")
        return
      }

      const dataWithAdvisor = {
        ...data,
        advisorId
      }

      console.log('Dados para envio:', dataWithAdvisor)

      if (isEditing && client?.id) {
        console.log('Atualizando cliente existente:', client.id)
        await updateClient.mutateAsync({ id: client.id, data: dataWithAdvisor })
      } else {
        console.log('Criando novo cliente')
        await createClient.mutateAsync(dataWithAdvisor)
      }
      
      console.log('Cliente salvo com sucesso, chamando onSuccess')
      onSuccess?.()
    } catch (error) {
      console.error("Erro ao salvar cliente:", error)
      toast.error("Erro ao salvar cliente. Verifique os dados e tente novamente.")
    }
  }

  const isLoading = createClient.isPending || updateClient.isPending

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? "Editar Cliente" : "Novo Cliente"}</CardTitle>
        <CardDescription>
          {isEditing 
            ? "Atualize as informações do cliente abaixo." 
            : "Preencha as informações para criar um novo cliente."
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
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="João Silva" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="joao@exemplo.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Idade</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="35" 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />



              <FormField
                control={form.control}
                name="totalWealth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patrimônio Total (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="1000000" 
                        type="number" 
                        step="0.01"
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
                name="alignmentPercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alinhamento (%)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="85" 
                        type="number" 
                        min="0" 
                        max="100"
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="alignmentCategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria de Alinhamento</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="HIGH">Alto (&gt; 90%)</SelectItem>
                      <SelectItem value="MEDIUM_HIGH">Médio-Alto (70% - 90%)</SelectItem>
                      <SelectItem value="MEDIUM_LOW">Médio-Baixo (50% - 70%)</SelectItem>
                      <SelectItem value="LOW">Baixo (&lt; 50%)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="familyProfile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Perfil Familiar</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva o perfil familiar do cliente..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Informações sobre a composição e características da família
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Cliente Ativo</FormLabel>
                    <FormDescription>
                      Cliente ativo no sistema e pode realizar operações
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                {isEditing ? "Atualizar Cliente" : "Criar Cliente"}
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
