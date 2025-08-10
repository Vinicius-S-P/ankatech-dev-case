"use client"

import { usePathname } from "next/navigation"
import { MainLayout } from "./main-layout"

interface ConditionalLayoutProps {
  children: React.ReactNode
}

const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password']

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  
  // Se estiver em uma rota pública, não aplicar o MainLayout
  if (PUBLIC_ROUTES.includes(pathname)) {
    return <>{children}</>
  }
  
  // Para rotas protegidas, aplicar o MainLayout
  return (
    <MainLayout>
      {children}
    </MainLayout>
  )
}
