import * as React from "react"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/utils"
import { Card } from "./card"

interface MetricCardProps {
  title: string
  value: number
  percentChange?: number
  icon?: React.ReactNode
  variant?: 'primary' | 'success' | 'danger' | 'warning'
  className?: string
}

export function MetricCard({
  title,
  value,
  percentChange,
  icon,
  variant = 'primary',
  className,
}: MetricCardProps) {
  const isPositive = percentChange && percentChange > 0

  const variantColors = {
    primary: 'bg-primary-blue/10 text-primary-blue',
    success: 'bg-success-green/10 text-success-green',
    danger: 'bg-error-red/10 text-error-red',
    warning: 'bg-orange/10 text-orange',
  }

  return (
    <Card variant="bordered" className={cn("p-6", className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-text mb-2">{title}</p>
          <p className="text-2xl font-bold text-white font-work">
            {formatCurrency(value)}
          </p>
          {percentChange !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={cn(
                  "text-sm font-medium",
                  isPositive ? "text-success-green" : "text-error-red"
                )}
              >
                {isPositive ? "+" : ""}{percentChange.toFixed(2)}%
              </span>
              <svg
                className={cn(
                  "w-4 h-4",
                  isPositive ? "text-success-green" : "text-error-red",
                  !isPositive && "rotate-180"
                )}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M5 15l7-7 7 7" />
              </svg>
            </div>
          )}
        </div>
        {icon && (
          <div className={cn(
            "p-3 rounded-full",
            variantColors[variant]
          )}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}
