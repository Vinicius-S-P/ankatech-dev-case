"use client"

export const dynamic = 'force-dynamic'

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useClients, useAuth, useWallets, useGoals } from "@/hooks/use-api"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Wallet } from "lucide-react"

interface Client {
  id: string
  name: string
  email: string
  age: number
  totalWealth?: number
  alignmentPercentage?: number
  alignmentCategory?: string
  active: boolean
  advisorId?: string
  familyProfile?: string
  createdAt: string
  updatedAt: string
}

interface WalletInvestment {
  id: string;
  clientId: string;
  asset: string;
  assetClass: string;
  quantity: number;
  unitPrice: number;
  currentValue: number;
  percentage: number;
}

interface Goal {
  id: string;
  name: string;
  targetValue: number;
}

interface ClientsResponse {
  clients: Client[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function Dashboard() {
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>(undefined)
  const { getUser } = useAuth()
  const { data: clientsData } = useClients(1, 100)
  const { data: walletsData } = useWallets(selectedClientId)
  const { data: goalsData } = useGoals(selectedClientId)

  const allClients = (clientsData as ClientsResponse)?.clients || []
  const wallets: WalletInvestment[] = walletsData?.wallets || []
  const goals: Goal[] = goalsData?.goals || []

  getUser()

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const assetClassTranslations: { [key: string]: string } = {
    "STOCKS": "Ações",
    "BONDS": "Renda Fixa",
    "REAL_ESTATE": "Imóveis",
    "COMMODITIES": "Commodities",
    "CASH": "Caixa",
    "PRIVATE_EQUITY": "Private Equity",
    "CRYPTO": "Criptomoedas",
    "OTHER": "Outros"
  };

  const getAssetClassTranslation = (assetClass: string) => {
    return assetClassTranslations[assetClass] || assetClass;
  };

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId === 'all' ? undefined : clientId)
  }

  const totalAlocado = wallets.reduce((sum: number, investment: WalletInvestment) => sum + investment.currentValue, 0) || 0

  const aggregatedByAssetClass = wallets.reduce((acc: Record<string, { totalValue: number; totalPercentage: number }>, investment: WalletInvestment) => {
    if (!acc[investment.assetClass]) {
      acc[investment.assetClass] = { totalValue: 0, totalPercentage: 0 };
    }
    acc[investment.assetClass].totalValue += investment.currentValue;
    acc[investment.assetClass].totalPercentage += investment.percentage;
    return acc;
  }, {} as Record<string, { totalValue: number; totalPercentage: number }>) || {};

  return (
      <div className="flex min-h-screen w-full flex-col">
        <div className="flex flex-col sm:gap-4 sm:py-4">

        <div className="px-4 mb-4">
          <div className="flex items-center gap-2">
            <Select onValueChange={handleClientChange} defaultValue={selectedClientId || 'all'}>
              <SelectTrigger className="w-[300px] text-md font-bold tracking-tight rounded-full">
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Clientes</SelectItem>
                {allClients.map((client: Client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-2xl font-bold text-zinc-400">Total Alocado</h2>
              <p className="text-3xl font-bold">{formatCurrency(totalAlocado)}</p>
            </div>

            <div className="bg-zinc-900 rounded-2xl p-6">
              {wallets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(Object.entries(aggregatedByAssetClass) as [string, { totalValue: number; totalPercentage: number }][]).map(([assetClass, data]) => (
                    <Card key={assetClass} className="bg-zinc-900 text-white border border-zinc-800">
                      <CardHeader>
                        <CardTitle>{getAssetClassTranslation(assetClass)}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xl font-bold">{formatCurrency(data.totalValue)}</p>
                        <p className="text-md text-blue-500 text-right">{(data.totalPercentage).toFixed(2)}%</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-white">
                  <Wallet className="w-12 h-12 mb-4" />
                  <p>Esse cliente não possui investimentos</p>
                </div>
              )}
            </div>

            <p className="text-sm text-zinc-400">
              Indicadores    
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <Card className="bg-zinc-900 text-white">
                <CardHeader>
                  <CardTitle>Metas</CardTitle>
                </CardHeader>
                <CardContent>
                  {goals.length > 0 ? (
                    <ul className="space-y-4">
                      {goals.map(goal => (
                        <li key={goal.id}>
                          <Card className="bg-zinc-800 text-white">
                            <CardContent className="p-4 flex justify-between items-center">
                              <p className="font-bold">{goal.name}</p>
                              <p>{formatCurrency(goal.targetValue)}</p>
                            </CardContent>
                          </Card>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>Nenhuma meta encontrada.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 text-white">
                <CardHeader>
                  <CardTitle>KPI Alocação</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(Object.entries(aggregatedByAssetClass) as [string, { totalValue: number; totalPercentage: number }][]).map(([assetClass, data]) => (
                      <div key={assetClass} className="space-y-1">
                        <div className="text-sm font-medium text-zinc-300">{getAssetClassTranslation(assetClass)}</div>
                        <div className="w-full bg-zinc-800 rounded-full h-8 flex items-center">
                          <div 
                            className="h-8 rounded-full flex items-center pr-2"
                            style={{ width: `${(data.totalPercentage.toFixed(2))}%`, background: 'linear-gradient(to right,rgba(110, 204, 63, 1) 0%,rgba(237, 221, 83, 1) 100%)' }}
                          >
                            <span className="text-white font-medium text-sm ml-2">
                              {(data.totalPercentage).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}