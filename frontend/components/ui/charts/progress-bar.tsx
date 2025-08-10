"use client"

import React from 'react'
import { cn } from '@/lib/utils'

interface ProgressBarProps {
  segments: {
    label: string
    value: number
    color: string
  }[]
  total: number
  className?: string
  height?: number
  showLabels?: boolean
}

export function ProgressBar({ 
  segments, 
  total, 
  className,
  height = 40,
  showLabels = true 
}: ProgressBarProps) {
  const calculatePercentage = (value: number) => (value / total) * 100

  return (
    <div className={cn("space-y-4", className)}>
      {/* Progress Bar */}
      <div 
        className="relative w-full bg-gray-nav rounded-[28px] overflow-hidden"
        style={{ height: `${height}px` }}
      >
        <div className="absolute inset-0 flex">
          {segments.map((segment, index) => {
            const percentage = calculatePercentage(segment.value)
            const previousPercentages = segments
              .slice(0, index)
              .reduce((sum, seg) => sum + calculatePercentage(seg.value), 0)
            
            return (
              <div
                key={index}
                className="absolute top-0 h-full transition-all duration-700 ease-out"
                style={{
                  left: `${previousPercentages}%`,
                  width: `${percentage}%`,
                  backgroundColor: segment.color,
                  borderRadius: index === 0 ? '28px 0 0 28px' : 
                               index === segments.length - 1 ? '0 28px 28px 0' : '0'
                }}
              />
            )
          })}
        </div>
        
        {/* Percentage Labels */}
        {segments.map((segment, index) => {
          const percentage = calculatePercentage(segment.value)
          const previousPercentages = segments
            .slice(0, index)
            .reduce((sum, seg) => sum + calculatePercentage(seg.value), 0)
          
          return (
            <div
              key={`label-${index}`}
              className="absolute top-1/2 -translate-y-1/2 text-xs font-bold"
              style={{
                left: `${previousPercentages + percentage / 2}%`,
                transform: 'translate(-50%, -50%)',
                color: segment.color === '#f7c14c' ? '#1b1b1b' : '#ffffff'
              }}
            >
              {Math.round(percentage)}%
            </div>
          )
        })}
      </div>
      
      {/* Legend */}
      {showLabels && (
        <div className="flex flex-wrap gap-6 items-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-3 bg-investment-blue rounded-sm" />
            <span className="text-investment-blue text-sm font-bold">Patrimônio atual</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-3 bg-chart-green rounded-sm" />
            <span className="text-chart-green text-sm font-bold">Realizado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-3 bg-chart-gold rounded-sm" />
            <span className="text-chart-gold text-sm font-bold">Meta do ano</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-3 bg-card-dark rounded-sm" />
            <span className="text-white text-sm font-bold">Meta da vida</span>
          </div>
        </div>
      )}
    </div>
  )
}
