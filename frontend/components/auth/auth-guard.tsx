"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    // Aguardar hidratação completa antes de verificar autenticação
    const checkAuth = () => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('authToken')
        
        if (token) {
          setIsAuthenticated(true)
        } else {
          setIsAuthenticated(false)
          // Aguardar um pouco antes de redirecionar para evitar problemas de hidratação
          setTimeout(() => {
            router.push("/login")
          }, 1500)
        }
      }
    }

    // Aguardar hidratação antes de verificar
    const timer = setTimeout(checkAuth, 1200)
    
    return () => clearTimeout(timer)
  }, [router])

  // Durante verificação inicial ou se não autenticado, renderizar placeholder
  if (isAuthenticated === null) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
    </div>
  }
  
  if (isAuthenticated === false) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-gray-600">Redirecionando para login...</p>
      </div>
    </div>
  }

  return <>{children}</>
}
