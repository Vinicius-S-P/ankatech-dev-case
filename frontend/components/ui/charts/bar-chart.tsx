"use client"

import React from 'react'
import { cn } from '@/lib/utils'

interface BarChartProps {
  data: {
    label: string
    value: number
    percentage: number
    color: string
  }[]
  className?: string
}

export function BarChart({ data, className }: BarChartProps) {
  const maxPercentage = Math.max(...data.map(item => item.percentage))

  return (
    <div className={cn("space-y-4", className)}>
      {data.map((item, index) => (
        <div key={index} className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-text-light text-sm font-medium">
              {item.label}
            </span>
            <span className="text-chart-blue text-sm font-medium">
              {item.percentage}%
            </span>
          </div>
          <div className="relative w-full h-[3px] bg-gray-border rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${(item.percentage / maxPercentage) * 100}%`,
                backgroundColor: item.color
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
