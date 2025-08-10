"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  TrendingUp, 
  PieChart, 
  Target, 
  Shield, 
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Info,
  Lightbulb
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface Suggestion {
  id: string
  type: 'CONTRIBUTION_INCREASE' | 'REBALANCING' | 'GOAL_ADJUSTMENT' | 'RISK_ANALYSIS' | 'TAX_OPTIMIZATION'
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  title: string
  description: string
  impact: string
  actionRequired: {
    amount?: number
    duration?: number
    frequency?: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'
    percentage?: number
    action?: string
  }
  reasoning: string
  potentialGain: number
  confidence: number
}

interface SuggestionsPanelProps {
  clientId: string
  className?: string
}

export function SuggestionsPanel({ clientId, className }: SuggestionsPanelProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadSuggestions()
  }, [clientId])

  const loadSuggestions = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Simular chamada à API
      // const response = await fetch(`/api/suggestions/${clientId}`)
      // const data = await response.json()
      
      // Mock data para demonstração
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockSuggestions: Suggestion[] = [
        {
          id: 'suggestion_1',
          type: 'CONTRIBUTION_INCREASE',
          priority: 'HIGH',
          title: 'Aumento de Contribuição Recomendado',
          description: 'Para melhorar seu alinhamento de 65.2% para 90%',
          impact: 'Alcançar meta "Aposentadoria" 8 meses mais cedo',
          actionRequired: {
            amount: 850,
            duration: 120,
            frequency: 'MONTHLY' as const
          },
          reasoning: 'Com o alinhamento atual de 65.2%, existe um gap significativo para alcançar suas metas. Aumentando a contribuição mensal, você pode melhorar substancialmente suas chances de sucesso.',
          potentialGain: 125000,
          confidence: 85
        },
        {
          id: 'suggestion_2',
          type: 'REBALANCING',
          priority: 'MEDIUM',
          title: 'Rebalanceamento de Carteira Necessário',
          description: 'Concentração excessiva em Ações (72.3%)',
          impact: 'Reduzir risco através de melhor diversificação',
          actionRequired: {
            percentage: 22,
            action: 'Redistribuir 22.3% para outras classes de ativos'
          },
          reasoning: 'Uma concentração de 72.3% em uma única classe de ativos aumenta significativamente o risco da carteira. O ideal seria manter entre 30-50% em cada classe principal.',
          potentialGain: 15000,
          confidence: 75
        },
        {
          id: 'suggestion_3',
          type: 'TAX_OPTIMIZATION',
          priority: 'LOW',
          title: 'Otimização Fiscal com Previdência',
          description: 'Não identificamos investimentos em previdência privada',
          impact: 'Economia fiscal de até R$ 8.250 por ano',
          actionRequired: {
            amount: 30000,
            action: 'Considerar aportes em PGBL para dedução no IR'
          },
          reasoning: 'Investimentos em PGBL permitem dedução de até 12% da renda bruta anual no Imposto de Renda, oferecendo vantagem fiscal significativa.',
          potentialGain: 8250,
          confidence: 65
        }
      ]
      
      setSuggestions(mockSuggestions)
    } catch (err) {
      setError('Erro ao carregar sugestões')
      console.error('Error loading suggestions:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getSuggestionIcon = (type: Suggestion['type']) => {
    switch (type) {
      case 'CONTRIBUTION_INCREASE':
        return <TrendingUp className="h-5 w-5" />
      case 'REBALANCING':
        return <PieChart className="h-5 w-5" />
      case 'GOAL_ADJUSTMENT':
        return <Target className="h-5 w-5" />
      case 'RISK_ANALYSIS':
        return <Shield className="h-5 w-5" />
      case 'TAX_OPTIMIZATION':
        return <DollarSign className="h-5 w-5" />
      default:
        return <Lightbulb className="h-5 w-5" />
    }
  }

  const getPriorityColor = (priority: Suggestion['priority']) => {
    switch (priority) {
      case 'HIGH':
        return 'destructive'
      case 'MEDIUM':
        return 'default'
      case 'LOW':
        return 'secondary'
      default:
        return 'secondary'
    }
  }

  const getPriorityIcon = (priority: Suggestion['priority']) => {
    switch (priority) {
      case 'HIGH':
        return <AlertTriangle className="h-4 w-4" />
      case 'MEDIUM':
        return <Info className="h-4 w-4" />
      case 'LOW':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const handleDismissSuggestion = (suggestionId: string) => {
    setDismissedSuggestions(prev => new Set([...prev, suggestionId]))
  }

  const visibleSuggestions = suggestions.filter(s => !dismissedSuggestions.has(s.id))

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Sugestões Automáticas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Sugestões Automáticas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Sugestões Automáticas
          {visibleSuggestions.length > 0 && (
            <Badge variant="secondary">{visibleSuggestions.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {visibleSuggestions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma sugestão disponível</p>
            <p className="text-sm">Suas finanças estão bem alinhadas!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleSuggestions.map((suggestion) => (
              <Alert key={suggestion.id} className="relative">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getSuggestionIcon(suggestion.type)}
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">
                          {suggestion.title}
                        </h4>
                        <Badge 
                          variant={getPriorityColor(suggestion.priority)}
                          className="flex items-center gap-1"
                        >
                          {getPriorityIcon(suggestion.priority)}
                          {suggestion.priority}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {suggestion.description}
                      </p>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-green-600">Impacto:</span>
                        <span>{suggestion.impact}</span>
                      </div>
                      
                      {suggestion.actionRequired.amount && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Ação:</span>
                          <span>
                            {suggestion.actionRequired.frequency === 'MONTHLY' && 'Contribuir '}
                            {suggestion.actionRequired.amount && formatCurrency(suggestion.actionRequired.amount)}
                            {suggestion.actionRequired.frequency === 'MONTHLY' && ' mensalmente'}
                            {suggestion.actionRequired.duration && ` por ${suggestion.actionRequired.duration} meses`}
                          </span>
                        </div>
                      )}
                      
                      {suggestion.actionRequired.action && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Ação:</span>
                          <span>{suggestion.actionRequired.action}</span>
                        </div>
                      )}

                      {suggestion.potentialGain > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-green-600">Ganho Potencial:</span>
                          <span>{formatCurrency(suggestion.potentialGain)}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <span className="font-medium">Confiança:</span>
                        <span>{suggestion.confidence}%</span>
                      </div>
                    </div>

                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        Ver detalhes
                      </summary>
                      <p className="mt-2 text-muted-foreground">
                        {suggestion.reasoning}
                      </p>
                    </details>

                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDismissSuggestion(suggestion.id)}
                        className="text-xs"
                      >
                        Dispensar
                      </Button>
                    </div>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
