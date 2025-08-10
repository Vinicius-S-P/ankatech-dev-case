"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { loginSchema, type LoginFormData } from "@/lib/schemas"
import { useAuth } from "@/hooks/use-api"
import { Loader2, Lock, AlertTriangle } from "lucide-react"

export default function LoginPage() {
  const { login, isLoggingIn } = useAuth()
  const [error, setError] = useState("")

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "advisor@mfoffice.com",
      password: "123456",
    },
  })

  // Removido useEffect de redirecionamento automático para evitar loops infinitos
  // O usuário será redirecionado apenas após fazer login com sucesso

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError("")
      await login(data)
      
      // Aguardar um pouco para garantir que o token foi salvo
      setTimeout(() => {
        // Verificar se o token foi realmente salvo antes de redirecionar
        const token = localStorage.getItem('authToken')
        if (token) {
          window.location.href = "/"
        } else {
          setError("Erro ao salvar dados de autenticação. Tente novamente.")
        }
      }, 500)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error && 
        typeof error.response === 'object' && error.response !== null &&
        'data' in error.response && 
        typeof error.response.data === 'object' && error.response.data !== null &&
        'message' in error.response.data && 
        typeof error.response.data.message === 'string'
        ? error.response.data.message
        : "Erro no login. Verifique suas credenciais."
      setError(errorMessage)
    }
  }

  const handleDemoLogin = (role: "advisor" | "viewer") => {
    const credentials = {
      advisor: { email: "advisor@mfoffice.com", password: "123456" },
      viewer: { email: "viewer@mfoffice.com", password: "123456" }
    }[role]

    form.setValue("email", credentials.email)
    form.setValue("password", credentials.password)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Financial Planner MFO</CardTitle>
          <CardDescription>
            Entre com suas credenciais para acessar a plataforma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Demo:</strong> Use as credenciais pré-preenchidas ou clique nos botões abaixo
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleDemoLogin("advisor")}
              type="button"
            >
              Demo Advisor
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleDemoLogin("viewer")}
              type="button"
            >
              Demo Viewer
            </Button>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="seu@email.com" 
                        type="email" 
                        {...field} 
                        className="pl-8"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Sua senha" 
                        type="password" 
                        {...field}
                        className="pl-8"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isLoggingIn} className="w-full">
                {isLoggingIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Lock className="mr-2 h-4 w-4" />
                Entrar
              </Button>
            </form>
          </Form>

          <div className="text-center text-sm text-muted-foreground">
            <p>Credenciais de demonstração:</p>
            <p><strong>Advisor:</strong> advisor@mfoffice.com / 123456</p>
            <p><strong>Viewer:</strong> viewer@mfoffice.com / 123456</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
