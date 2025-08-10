"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider 
      attribute="class"
      defaultTheme="dark"        // Dark mode como padrão conforme spec
      enableSystem={false}       // Não seguir preferência do sistema
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}
