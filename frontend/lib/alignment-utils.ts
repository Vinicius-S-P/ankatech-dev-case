/**
 * Utilities for alignment categorization according to specification
 */

export type AlignmentCategory = 'excellent' | 'good' | 'warning' | 'poor'

export interface AlignmentConfig {
  category: AlignmentCategory
  label: string
  color: string
  bgColor: string
  textColor: string
}

/**
 * Get alignment category based on percentage
 * Exact from specification:
 * - "> 90%" - verde (excellent)
 * - "90% a 70%" - amarelo-claro (good)  
 * - "70% a 50%" - amarelo-escuro (warning)
 * - "< 50%" - vermelho (poor)
 */
export function getAlignmentCategory(percentage: number): AlignmentCategory {
  if (percentage > 90) return 'excellent'
  if (percentage >= 70) return 'good'
  if (percentage >= 50) return 'warning'
  return 'poor'
}

/**
 * Get alignment configuration with colors
 */
export function getAlignmentConfig(percentage: number): AlignmentConfig {
  const category = getAlignmentCategory(percentage)
  
  const configs: Record<AlignmentCategory, AlignmentConfig> = {
    excellent: {
      category: 'excellent',
      label: '> 90%',
      color: 'var(--alignment-excellent)',
      bgColor: 'bg-green-500/10',
      textColor: 'text-green-600 dark:text-green-400'
    },
    good: {
      category: 'good',
      label: '90% a 70%',
      color: 'var(--alignment-good)',
      bgColor: 'bg-yellow-400/10',
      textColor: 'text-yellow-600 dark:text-yellow-400'
    },
    warning: {
      category: 'warning',
      label: '70% a 50%',
      color: 'var(--alignment-warning)',
      bgColor: 'bg-orange-500/10',
      textColor: 'text-orange-600 dark:text-orange-400'
    },
    poor: {
      category: 'poor',
      label: '< 50%',
      color: 'var(--alignment-poor)',
      bgColor: 'bg-red-500/10',
      textColor: 'text-red-600 dark:text-red-400'
    }
  }
  
  return configs[category]
}

/**
 * Get badge variant for alignment
 */
export function getAlignmentBadgeVariant(percentage: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  const category = getAlignmentCategory(percentage)
  
  switch (category) {
    case 'excellent':
      return 'default'
    case 'good':
      return 'secondary'
    case 'warning':
      return 'outline'
    case 'poor':
      return 'destructive'
    default:
      return 'secondary'
  }
}

/**
 * Format alignment percentage for display
 */
export function formatAlignmentPercentage(percentage: number): string {
  return `${percentage.toFixed(1)}%`
}

/**
 * Get alignment status text
 */
export function getAlignmentStatusText(percentage: number): string {
  const category = getAlignmentCategory(percentage)
  
  const statusTexts: Record<AlignmentCategory, string> = {
    excellent: 'Excelente Alinhamento',
    good: 'Bom Alinhamento', 
    warning: 'Atenção Necessária',
    poor: 'Revisão Urgente'
  }
  
  return statusTexts[category]
}
