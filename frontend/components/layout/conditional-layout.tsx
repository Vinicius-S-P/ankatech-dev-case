"use client"

import { usePathname } from "next/navigation"
import { MainLayout } from "./main-layout"

interface ConditionalLayoutProps {
  children: React.ReactNode
}

const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password']

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  
  if (PUBLIC_ROUTES.includes(pathname)) {
    return <>{children}</>
  }
  
  return (
    <MainLayout>
      {children}
    </MainLayout>
  )
}
