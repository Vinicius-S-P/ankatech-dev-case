"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Slider } from "@/components/ui/slider"
import { 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Calculator,
  DollarSign
} from "lucide-react"
import { toast } from "sonner"

interface CurrentAllocation {
  name: string
  value: number
  percentage: number
  count: number
  color: string
}

interface RebalanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentAllocations: CurrentAllocation[]
  targetAllocations: Record<string, number>
  onRebalance: (targetAllocations: Record<string, number>) => void
}

const assetClassMapping: Record<string, string> = {
  'Ações': 'STOCKS',
  'Renda Fixa': 'BONDS', 
  'Fundos Imobiliários': 'REAL_ESTATE',
  'Commodities': 'COMMODITIES',
  'Caixa': 'CASH',
  'Criptomoedas': 'CRYPTO',
  'Private Equity': 'PRIVATE_EQUITY',
  'Outros': 'OTHER'
}

export function RebalanceDialog({ 
  open, 
  onOpenChange, 
  currentAllocations, 
  targetAllocations,
  onRebalance 
}: RebalanceDialogProps) {
  const [customTargets, setCustomTargets] = useState<Record<string, number>>(targetAllocations)
  const [rebalanceMode, setRebalanceMode] = useState<'preset' | 'custom'>('preset')
  const [isProcessing, setIsProcessing] = useState(false)

  const totalCurrentValue = currentAllocations.reduce((sum, allocation) => sum + allocation.value, 0)

  const handleCustomTargetChange = (assetClass: string, value: number) => {
    setCustomTargets(prev => ({
      ...prev,
      [assetClass]: value
    }))
  }

  const getRebalanceActions = () => {
    const targets = rebalanceMode === 'preset' ? targetAllocations : customTargets
    const actions: Array<{
      assetClass: string
      action: 'buy' | 'sell' | 'hold'
      currentPercentage: number
      targetPercentage: number
      currentValue: number
      targetValue: number
      amountChange: number
      percentageChange: number
    }> = []

    Object.entries(targets).forEach(([key, targetPercentage]) => {
      const current = currentAllocations.find(a => assetClassMapping[a.name] === key)
      const currentPercentage = current?.percentage || 0
      const currentValue = current?.value || 0
      const targetValue = (targetPercentage / 100) * totalCurrentValue
      const amountChange = targetValue - currentValue
      const percentageChange = targetPercentage - currentPercentage

      if (Math.abs(percentageChange) > 0.5) { // Only show significant changes
        actions.push({
          assetClass: current?.name || key,
          action: amountChange > 0 ? 'buy' : 'sell',
          currentPercentage,
          targetPercentage,
          currentValue,
          targetValue,
          amountChange,
          percentageChange
        })
      }
    })

    return actions.sort((a, b) => Math.abs(b.amountChange) - Math.abs(a.amountChange))
  }

  const validateTargets = () => {
    const targets = rebalanceMode === 'preset' ? targetAllocations : customTargets
    const total = Object.values(targets).reduce((sum, val) => sum + val, 0)
    return Math.abs(total - 100) < 0.1 // Allow small rounding errors
  }

  const handleRebalance = async () => {
    if (!validateTargets()) {
      toast.error("A soma dos percentuais deve ser 100%")
      return
    }

    setIsProcessing(true)
    try {
      const targets = rebalanceMode === 'preset' ? targetAllocations : customTargets
      await onRebalance(targets)
    } finally {
      setIsProcessing(false)
    }
  }

  const actions = getRebalanceActions()
  const isValid = validateTargets()
  const totalTarget = Object.values(rebalanceMode === 'preset' ? targetAllocations : customTargets).reduce((sum, val) => sum + val, 0)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Rebalanceamento de Portfólio
          </DialogTitle>
          <DialogDescription>
            Ajuste automaticamente as alocações para atingir o perfil de investimento desejado
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Mode Selection */}
          <Tabs value={rebalanceMode} onValueChange={(value) => setRebalanceMode(value as 'preset' | 'custom')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preset">Perfil Pré-definido</TabsTrigger>
              <TabsTrigger value="custom">Alocação Personalizada</TabsTrigger>
            </TabsList>

            <TabsContent value="preset" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Alocação Alvo (Perfil Moderado)</CardTitle>
                  <CardDescription>
                    Distribuição recomendada baseada no perfil de risco selecionado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(targetAllocations).map(([key, percentage]) => {
                      const label = Object.keys(assetClassMapping).find(k => assetClassMapping[k] === key) || key
                      return (
                        <div key={key} className="flex items-center justify-between">
                          <span className="font-medium">{label}</span>
                          <div className="flex items-center gap-2">
                            <Progress value={percentage} className="w-24 h-2" />
                            <span className="w-12 text-sm">{percentage}%</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="custom" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Alocação Personalizada</CardTitle>
                  <CardDescription>
                    Defina manualmente os percentuais para cada classe de ativo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(targetAllocations).map(([key, defaultPercentage]) => {
                      const label = Object.keys(assetClassMapping).find(k => assetClassMapping[k] === key) || key
                      const value = customTargets[key] || defaultPercentage
                      
                      return (
                        <div key={key} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="font-medium">{label}</Label>
                            <span className="text-sm font-medium">{value}%</span>
                          </div>
                          <Slider
                            value={[value]}
                            onValueChange={(newValue) => handleCustomTargetChange(key, newValue[0])}
                            max={100}
                            step={1}
                            className="w-full"
                          />
                        </div>
                      )
                    })}
                    
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Total:</span>
                        <span className={`font-bold ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                          {totalTarget.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Current vs Target Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Comparação: Atual vs Alvo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentAllocations.map((current) => {
                  const assetKey = assetClassMapping[current.name]
                  const targets = rebalanceMode === 'preset' ? targetAllocations : customTargets
                  const target = targets[assetKey] || 0
                  const difference = current.percentage - target
                  
                  return (
                    <div key={current.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{current.name}</span>
                        <div className="flex items-center gap-4 text-sm">
                          <span>Atual: {current.percentage.toFixed(1)}%</span>
                          <span>Alvo: {target.toFixed(1)}%</span>
                          <Badge variant={Math.abs(difference) > 5 ? "destructive" : difference > 0 ? "default" : "secondary"}>
                            {difference > 0 ? '+' : ''}{difference.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Progress value={current.percentage} className="h-2" />
                        <Progress value={target} className="h-2 bg-muted" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Rebalance Actions */}
          {actions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Ações de Rebalanceamento
                </CardTitle>
                <CardDescription>
                  Movimentações necessárias para atingir a alocação alvo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {actions.map((action, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          action.action === 'buy' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {action.action === 'buy' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        </div>
                        <div>
                          <div className="font-medium">
                            {action.action === 'buy' ? 'Comprar' : 'Vender'} {action.assetClass}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {action.currentPercentage.toFixed(1)}% → {action.targetPercentage.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {formatCurrency(Math.abs(action.amountChange))}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {action.percentageChange > 0 ? '+' : ''}{action.percentageChange.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Validation Alert */}
          {!isValid && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                A soma dos percentuais deve ser 100%. Atualmente: {totalTarget.toFixed(1)}%
              </AlertDescription>
            </Alert>
          )}

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Resumo da Operação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Patrimônio Total</p>
                  <p className="font-medium text-lg">{formatCurrency(totalCurrentValue)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total de Movimentações</p>
                  <p className="font-medium text-lg">
                    {formatCurrency(actions.reduce((sum, action) => sum + Math.abs(action.amountChange), 0))}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Ações Necessárias</p>
                  <p className="font-medium text-lg">{actions.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Desvio Máximo</p>
                  <p className="font-medium text-lg">
                    {actions.length > 0 ? `${Math.max(...actions.map(a => Math.abs(a.percentageChange))).toFixed(1)}%` : '0%'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleRebalance}
              disabled={!isValid || actions.length === 0 || isProcessing}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Target className="mr-2 h-4 w-4" />
                  Executar Rebalanceamento
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
