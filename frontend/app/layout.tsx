import type { Metadata } from "next"
import "./globals.css"
import { ConditionalLayout } from "@/components/layout/conditional-layout"
import { inter, workSans } from "@/lib/fonts"
import { Providers } from "./providers"
import { Toaster } from "@/components/ui/sonner"

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Financial Dashboard",
  description: "Sistema de gerenciamento e visualização de dados financeiros",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${workSans.variable} antialiased`} suppressHydrationWarning>
        <Providers>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  )
}