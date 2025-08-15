"use client"

export const dynamic = 'force-dynamic'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { WalletForm } from "@/components/forms/wallet-form"
import { RebalanceDialog } from "@/components/dialogs/rebalance-dialog"
import { useWallets, useDeleteWallet, useRebalancePortfolio, useClients } from "@/hooks/use-api"
import { 
  Wallet,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  RefreshCw
} from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"
import { CivilStatus, ChildrenStatus, DependantsStatus } from "@/lib/schemas"

interface Client {
  id: string
  name: string
  email: string
  age: number
  totalWealth: number
  alignmentPercentage?: number
  active: boolean
  advisorId?: string
  familyProfile?: (z.infer<typeof CivilStatus> | z.infer<typeof ChildrenStatus> | z.infer<typeof DependantsStatus>)[]
  createdAt: string
  updatedAt: string
}

interface WalletData {
  id: string
  clientId: string
  clientName?: string
  assetClass: 'STOCKS' | 'BONDS' | 'REAL_ESTATE' | 'COMMODITIES' | 'CASH' | 'CRYPTO' | 'PRIVATE_EQUITY' | 'OTHER'
  description?: string
  currentValue: number
  percentage: number
  targetPercentage?: number
  performance?: {
    oneMonth: number
    threeMonths: number
    sixMonths: number
    oneYear: number
  }
  createdAt: string
  updatedAt: string
}

const assetClassLabels = {
  STOCKS: 'Ações',
  BONDS: 'Renda Fixa',
  REAL_ESTATE: 'Fundos Imobiliários',
  COMMODITIES: 'Commodities',
  CASH: 'Caixa',
  CRYPTO: 'Criptomoedas',
  PRIVATE_EQUITY: 'Private Equity',
  OTHER: 'Outros'
}

const assetClassColors = {
  STOCKS: '#2563eb',
  BONDS: '#16a34a',
  REAL_ESTATE: '#ca8a04',
  COMMODITIES: '#dc2626',
  CASH: '#64748b',
  CRYPTO: '#7c3aed',
  PRIVATE_EQUITY: '#ea580c',
  OTHER: '#6b7280'
}

const targetAllocations = {
  CONSERVATIVE: {
    BONDS: 60,
    STOCKS: 25,
    REAL_ESTATE: 10,
    CASH: 5
  },
  MODERATE: {
    STOCKS: 50,
    BONDS: 30,
    REAL_ESTATE: 15,
    CASH: 5
  },
  AGGRESSIVE: {
    STOCKS: 70,
    BONDS: 15,
    REAL_ESTATE: 10,
    CRYPTO: 3,
    CASH: 2
  }
}

export default function PortfolioPage() {
  const [search, setSearch] = useState("")
  const [selectedClient, setSelectedClient] = useState<string>("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isRebalanceOpen, setIsRebalanceOpen] = useState(false)
  const [editingWallet, setEditingWallet] = useState<WalletData | null>(null)
  
  const { data: clientsData } = useClients(1, 100)
  const { data: walletsData, isLoading, error } = useWallets(selectedClient, 1, 100, search)
  const deleteWallet = useDeleteWallet()
  const rebalancePortfolio = useRebalancePortfolio()

  const clients = clientsData?.clients || []

  const handleClientChange = (clientId: string) => {
    setSelectedClient(clientId)
    setSearch("")
  }

  const handleDeleteWallet = async (walletId: string, description: string) => {
    if (confirm(`Tem certeza que deseja remover "${description}"?`)) {
      try {
        await deleteWallet.mutateAsync(walletId)
        toast.success("Posição removida com sucesso!")
      } catch (error) {
        console.error("Erro ao deletar posição:", error)
        toast.error("Erro ao remover posição")
      }
    }
  }

  const handleEditWallet = (wallet: WalletData) => {
    setEditingWallet(wallet)
    setIsDialogOpen(true)
  }

  const handleFormSuccess = () => {
    setIsDialogOpen(false)
    setEditingWallet(null)
    toast.success("Operação realizada com sucesso!")
  }

  const handleRebalance = async (targetAllocations: Record<string, number>) => {
    try {
      await rebalancePortfolio.mutateAsync({
        clientId: selectedClient,
        targetAllocations
      })
      toast.success("Rebalanceamento realizado com sucesso!")
      setIsRebalanceOpen(false)
    } catch (error) {
      console.error("Erro no rebalanceamento:", error)
      toast.error("Erro ao rebalancear portfólio")
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const wallets: WalletData[] = (walletsData?.wallets as WalletData[]) ?? []
  const totalValue = wallets.reduce((sum: number, wallet: WalletData) => sum + wallet.currentValue, 0)

  const currentDistribution = Object.entries(assetClassLabels).map(([assetClass, label]) => {
    const classWallets = wallets.filter((w: WalletData) => w.assetClass === (assetClass as WalletData['assetClass']))
    const value = classWallets.reduce((sum: number, w: WalletData) => sum + w.currentValue, 0)
    const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0
    
    return {
      name: label,
      value,
      percentage,
      count: classWallets.length,
      color: assetClassColors[assetClass as keyof typeof assetClassColors]
    }
  }).filter((item) => item.value > 0)


  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="p-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>Erro ao carregar carteiras. Verifique se o backend está rodando.</span>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfólio de Investimentos</h1>
          <p className="text-muted-foreground">
            Gerencie alocações e posições de carteiras
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsRebalanceOpen(true)}
            disabled={!selectedClient || wallets.length === 0}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Rebalancear
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) setEditingWallet(null)
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Posição
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingWallet ? "Editar Posição" : "Nova Posição"}
                </DialogTitle>
              </DialogHeader>
              <WalletForm 
                wallet={editingWallet}
                onSuccess={handleFormSuccess}
                onCancel={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="w-full">
        <Select onValueChange={handleClientChange} value={selectedClient}>
          <SelectTrigger className="w-[650px] text-3xl font-bold tracking-tight rounded-full">
            <SelectValue placeholder="Selecione um cliente" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client: Client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedClient ? (
        <Card>
          <CardHeader>
            <CardTitle>Posições Detalhadas</CardTitle>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar posições..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[150px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Classe de Ativo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor Atual</TableHead>
                    <TableHead>% Portfólio</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wallets.map((wallet) => (
                    <TableRow key={wallet.id}>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          style={{ 
                            borderColor: assetClassColors[wallet.assetClass],
                            color: assetClassColors[wallet.assetClass]
                          }}
                        >
                          {assetClassLabels[wallet.assetClass]}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {wallet.description || "N/A"}
                      </TableCell>
                      <TableCell>{formatCurrency(wallet.currentValue)}</TableCell>
                      <TableCell>{formatPercentage(wallet.percentage)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditWallet(wallet)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteWallet(wallet.id, wallet.description || wallet.assetClass)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {!isLoading && wallets.length === 0 && (
              <div className="text-center py-12">
                <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma posição encontrada</h3>
                <p className="text-muted-foreground mb-4">
                  {search ? "Tente ajustar os termos de busca" : "Comece adicionando a primeira posição"}
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Posição
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center h-96">
            <div className="text-center">
              <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Selecione um Cliente</h3>
            </div>
          </CardContent>
        </Card>
      )}

      <RebalanceDialog
        open={isRebalanceOpen}
        onOpenChange={setIsRebalanceOpen}
        currentAllocations={currentDistribution}
        targetAllocations={targetAllocations.MODERATE}
        onRebalance={handleRebalance}
      />
    </div>
  )
}
