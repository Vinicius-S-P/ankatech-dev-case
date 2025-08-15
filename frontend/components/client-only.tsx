"use client"

import { useClientOnly } from "@/hooks/use-client-only"
import { ReactNode } from "react"

interface ClientOnlyProps {
  children: ReactNode
  fallback?: ReactNode
}

export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const isClient = useClientOnly()

  if (!isClient) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
