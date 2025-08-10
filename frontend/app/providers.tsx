"use client";

import { ThemeProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children, ...props }: ThemeProviderProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem {...props}>
      {children}
      <Toaster />
    </ThemeProvider>
  );
}