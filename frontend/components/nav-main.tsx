"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname()
  return (
    <nav
      className={cn("flex items-center space-x-4 lg:space-x-6", className)}
      {...props}
    >
      <Link
        href="/dashboard"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/dashboard" ? "text-primary" : "text-muted-foreground"
        )}
      >
        Dashboard
      </Link>
      <Link
        href="/clients"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/clients" ? "text-primary" : "text-muted-foreground"
        )}
      >
        Clients
      </Link>
      <Link
        href="/goals"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/goals" ? "text-primary" : "text-muted-foreground"
        )}
      >
        Goals
      </Link>
      <Link
        href="/projections"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/projections" ? "text-primary" : "text-muted-foreground"
        )}
      >
        Projections
      </Link>
      <Link
        href="/simulations"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/simulations" ? "text-primary" : "text-muted-foreground"
        )}
      >
        Simulations
      </Link>
      <Link
        href="/events"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/events" ? "text-primary" : "text-muted-foreground"
        )}
      >
        Events
      </Link>
      <Link
        href="/insurance"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/insurance" ? "text-primary" : "text-muted-foreground"
        )}
      >
        Insurance
      </Link>
    </nav>
  )
}