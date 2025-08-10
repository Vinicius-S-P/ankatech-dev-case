"use client"

import React from 'react'
import { cn } from '@/lib/utils'

interface DonutChartProps {
  data: {
    label: string
    value: number
    color: string
  }[]
  size?: number
  strokeWidth?: number
  className?: string
  showPercentage?: boolean
}

export function DonutChart({ 
  data, 
  size = 200, 
  strokeWidth = 30,
  className,
  showPercentage = true
}: DonutChartProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const total = data.reduce((sum, item) => sum + item.value, 0)
  
  let cumulativePercentage = 0

  return (
    <div className={cn("relative", className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--gray-border)"
          strokeWidth={strokeWidth}
        />
        
        {/* Data segments */}
        {data.map((item, index) => {
          const percentage = (item.value / total) * 100
          const dashLength = (percentage / 100) * circumference
          const dashOffset = cumulativePercentage * circumference / 100
          
          cumulativePercentage += percentage
          
          return (
            <circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
              strokeDashoffset={-dashOffset}
              className="transition-all duration-500 ease-out"
            />
          )
        })}
      </svg>
      
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-3xl font-bold text-error-red">
              {Math.round((data[0]?.value / total) * 100)}%
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
