"use client"

import { AppSidebar } from "@/components/layout/app-layout"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div>
      <AppSidebar />
      <main>{children}</main>
    </div>
  )
}
