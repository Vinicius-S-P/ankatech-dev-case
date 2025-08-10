"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuthentication = () => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('authToken')
        const user = localStorage.getItem('user')
        
        if (token && user) {
          setIsAuthenticated(true)
        } else {
          setIsAuthenticated(false)
          router.push("/login")
        }
      }
      setIsLoading(false)
    }

    // Aguardar um pouco para garantir que o componente foi hidratado
    const timeoutId = setTimeout(checkAuthentication, 100)
    
    return () => clearTimeout(timeoutId)
  }, [router])

  // Mostrar loading enquanto verifica autenticação
  if (isLoading || isAuthenticated === null) {
    return (
      <div className="flex min-h-screen w-full flex-col p-4">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="mt-8 grid gap-4 md:gap-8 lg:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  // Se não está autenticado, não renderizar nada (redirecionamento já foi feito)
  if (!isAuthenticated) {
    return null
  }

  // Se está autenticado, renderizar o conteúdo
  return <>{children}</>
}
