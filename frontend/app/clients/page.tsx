'use client'
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ClientForm } from "@/components/forms/client-form"
import { useClients, useDeleteClient, useGoals, useInsurances } from "@/hooks/use-api"
import { z } from "zod"
import { 
  Plus, 
  Search, 
  Users, 
  Edit, 
  Trash2, 
  Eye,
  AlertTriangle
} from "lucide-react"
import { toast } from "sonner"
import { CivilStatus, ChildrenStatus, DependantsStatus } from "@/lib/schemas"

const familyProfileTranslations: Record<string, string> = {
  [CivilStatus.enum.SINGLE]: "Solteiro(a)",
  [CivilStatus.enum.MARRIED]: "Casado(a)",
  [CivilStatus.enum.DIVORCED]: "Divorciado(a)",
  [CivilStatus.enum.WIDOWED]: "Viúvo(a)",
  [ChildrenStatus.enum.HAS_CHILDREN]: "Com filhos",
  [ChildrenStatus.enum.NO_CHILDREN]: "Sem filhos",
  [DependantsStatus.enum.HAS_DEPENDANTS]: "Com dependentes",
  [DependantsStatus.enum.NO_DEPENDANTS]: "Sem dependentes",
}

// Types
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

interface Goal {
  id: string;
  clientId: string;
  name: string;
  targetValue: number;
  currentValue: number;
  targetDate: string;
}

interface Insurance {
  id: string;
  clientId: string;
  type: string;
  coverage: number;
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

const getAlignmentDistribution = (clients: Client[]) => {
  const distribution = [0, 0, 0, 0, 0, 0];
  
  clients.forEach(client => {
    const alignment = client.alignmentPercentage || 0;
    if (alignment < 50) distribution[0]++;
    else if (alignment >= 50 && alignment < 60) distribution[1]++;
    else if (alignment >= 60 && alignment < 70) distribution[2]++;
    else if (alignment >= 70 && alignment < 80) distribution[3]++;
    else if (alignment >= 80 && alignment < 90) distribution[4]++;
    else if (alignment >= 90) distribution[5]++;
  });
  
  return distribution;
};

const getClientsWithGoals = (clients: Client[], goals: Goal[]) => {
  const clientIdsWithGoals = new Set(goals.map(goal => goal.clientId));
  return clients.filter(client => clientIdsWithGoals.has(client.id)).length;
};

const getMostCommonCivilStatus = (clients: Client[]) => {
  const statusCount = {
    [CivilStatus.enum.SINGLE]: 0,
    [CivilStatus.enum.MARRIED]: 0,
    [CivilStatus.enum.DIVORCED]: 0,
    [CivilStatus.enum.WIDOWED]: 0
  };
  
  clients.forEach(client => {
    if (client.familyProfile) {
      client.familyProfile.forEach(profile => {
        if (profile in statusCount) {
          statusCount[profile as keyof typeof statusCount]++;
        }
      });
    }
  });
  
  let mostCommonStatus: keyof typeof statusCount = CivilStatus.enum.SINGLE;
  let maxCount = 0;
  
  Object.entries(statusCount).forEach(([status, count]) => {
    if (count > maxCount) {
      mostCommonStatus = status as keyof typeof statusCount;
      maxCount = count;
    }
  });
  
  return mostCommonStatus;
};

const getInsurancePercentageByCivilStatus = (clients: Client[], insurances: Insurance[], civilStatus: string) => {
  const clientsWithStatus = clients.filter(client => 
    client.familyProfile?.includes(civilStatus as z.infer<typeof CivilStatus>)
  );
  
  if (clientsWithStatus.length === 0) return 0;
  
  const clientIdsWithInsurance = new Set(insurances.map(insurance => insurance.clientId));
  const clientsWithInsurance = clientsWithStatus.filter(client => clientIdsWithInsurance.has(client.id)).length;
  
  return Math.round((clientsWithInsurance / clientsWithStatus.length) * 100);
};

const getInsurancePercentageByChildrenStatus = (clients: Client[], insurances: Insurance[]) => {
  const clientsWithChildren = clients.filter(client => 
    client.familyProfile?.includes(ChildrenStatus.enum.HAS_CHILDREN)
  );
  
  if (clientsWithChildren.length === 0) return 0;
  
  const clientIdsWithInsurance = new Set(insurances.map(insurance => insurance.clientId));
  const clientsWithInsurance = clientsWithChildren.filter(client => clientIdsWithInsurance.has(client.id)).length;
  
  return Math.round((clientsWithInsurance / clientsWithChildren.length) * 100);
};

const getInsurancePercentageByDependantsStatus = (clients: Client[], insurances: Insurance[]) => {
  const clientsWithDependants = clients.filter(client => 
    client.familyProfile?.includes(DependantsStatus.enum.HAS_DEPENDANTS)
  );
  
  if (clientsWithDependants.length === 0) return 0;
  
  const clientIdsWithInsurance = new Set(insurances.map(insurance => insurance.clientId));
  const clientsWithInsurance = clientsWithDependants.filter(client => clientIdsWithInsurance.has(client.id)).length;
  
  return Math.round((clientsWithInsurance / clientsWithDependants.length) * 100);
};

export default function ClientsPage() {
  const [search, setSearch] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  
  const { data: clientsData, isLoading, error, refetch } = useClients(1, 50, search)
  const { data: goalsData } = useGoals();
  const { data: insurancesData } = useInsurances();
  const deleteClient = useDeleteClient()
  
  const clients = (clientsData as ClientsResponse)?.clients || [] as Client[]
  const totalClients = (clientsData as ClientsResponse)?.pagination?.total || 0
  const goals = goalsData?.goals || [];
  const insurances = insurancesData?.insurance || [];

  const alignmentDistribution = getAlignmentDistribution(clients);
  const clientsWithGoals = getClientsWithGoals(clients, goals);
  
  const mostCommonCivilStatus = getMostCommonCivilStatus(clients);
  const civilStatusInsurancePercentage = getInsurancePercentageByCivilStatus(clients, insurances, mostCommonCivilStatus);
  const childrenInsurancePercentage = getInsurancePercentageByChildrenStatus(clients, insurances);
  const dependantsInsurancePercentage = getInsurancePercentageByDependantsStatus(clients, insurances);

  const handleDeleteClient = async (clientId: string, clientName: string) => {
    if (confirm(`Tem certeza que deseja remover o cliente "${clientName}"?`)) {
      try {
        await deleteClient.mutateAsync(clientId)
      } catch (error) {
        console.error("Erro ao deletar cliente:", error)
      }
    }
  }

  const handleEditClient = (client: Client) => {
    setEditingClient(client)
    setIsDialogOpen(true)
  }

  const handleFormSuccess = () => {
    setIsDialogOpen(false)
    setEditingClient(null)
    refetch()
    toast.success("Operação realizada com sucesso!")
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="p-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>Erro ao carregar clientes. Verifique se o backend está rodando.</span>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie seus clientes e acompanhe o alinhamento financeiro
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) setEditingClient(null)
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingClient ? "Editar Cliente" : "Novo Cliente"}
              </DialogTitle>
            </DialogHeader>
            <ClientForm 
              client={editingClient ? {
                ...editingClient,
                advisorId: editingClient.advisorId || "",
              } : undefined}
              onSuccess={handleFormSuccess}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900 rounded-2xl p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">Distribuição de Alinhamento</h3>
            <p className="text-sm text-zinc-400">
              Porcentagem de clientes por faixa de alinhamento
            </p>
          </div>
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="text-sm font-medium text-zinc-300">Abaixo de 50%</div>
              <div className="w-full bg-zinc-800 rounded-full h-8 flex items-center">
                <div 
                  className="bg-red-600 h-8 rounded-full flex items-center pr-2"
                  style={{ width: `${totalClients > 0 ? (alignmentDistribution[0] / totalClients) * 100 : 0}%` }}
                >
                  {alignmentDistribution[0] > 0 && (
                    <span className="text-white font-medium text-sm ml-2">
                      {(alignmentDistribution[0] / totalClients) * 100} %
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-sm font-medium text-zinc-300">50% - 70%</div>
              <div className="w-full bg-zinc-800 rounded-full h-8 flex items-center">
                <div 
                  className="bg-orange-500 h-8 rounded-full flex items-center pr-2"
                  style={{ width: `${totalClients > 0 ? ((alignmentDistribution[1] + alignmentDistribution[2]) / totalClients) * 100 : 0}%` }}
                >
                  {alignmentDistribution[1] + alignmentDistribution[2] > 0 && (
                    <span className="text-white font-medium text-sm ml-2">
                      {((alignmentDistribution[1] + alignmentDistribution[2]) / totalClients) * 100} %
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-sm font-medium text-zinc-300">70% - 90%</div>
              <div className="w-full bg-zinc-800 rounded-full h-8 flex items-center">
                <div 
                  className="bg-yellow-500 h-8 rounded-full flex items-center pr-2"
                  style={{ width: `${totalClients > 0 ? ((alignmentDistribution[3] + alignmentDistribution[4]) / totalClients) * 100 : 0}%` }}
                >
                  {alignmentDistribution[3] + alignmentDistribution[4] > 0 && (
                    <span className="text-white font-medium text-sm ml-2">
                      {((alignmentDistribution[3] + alignmentDistribution[4]) / totalClients) * 100} %
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-sm font-medium text-zinc-400">Acima de 90%</div>
              <div className="w-full bg-zinc-800 rounded-full h-8 flex items-center">
                <div 
                  className="bg-green-600 h-8 rounded-full flex items-center pr-2"
                  style={{ width: `${totalClients > 0 ? (alignmentDistribution[5] / totalClients) * 100 : 0}%` }}
                >
                  {alignmentDistribution[5] > 0 && (
                    <span className="text-white font-medium text-sm ml-2">
                      {(alignmentDistribution[5] / totalClients) * 100} %
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">Clientes com Metas</h3>
            <p className="text-sm text-zinc-400">
              Porcentagem de clientes que possuem metas financeiras
            </p>
          </div>
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#3f3f46" /* zinc-700 */
                  strokeWidth="8"
                />
                <defs>
                  <linearGradient id="goalGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(110, 204, 63, 1)" />
                    <stop offset="100%" stopColor="rgba(237, 221, 83, 1)" />
                  </linearGradient>
                </defs>
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="url(#goalGradient)"
                  strokeWidth="8"
                  strokeDasharray="283" // 2 * π * 45
                  strokeDashoffset={283 - (283 * (totalClients > 0 ? (clientsWithGoals / totalClients) : 0))}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {totalClients > 0 ? Math.round((clientsWithGoals / totalClients) * 100) : 0}%
                </span>
                <span className="text-sm text-zinc-400">Com metas</span>
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-zinc-300">
                {clientsWithGoals} de {totalClients} clientes
              </p>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-6 md:col-span-1 md:row-span-2 flex flex-col">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">Perfis com cobertura de seguro</h3>
            <p className="text-sm text-zinc-400">
              Por perfil de cliente
            </p>
          </div>
          <div className="flex flex-col justify-around align-flex-start h-[80%]">
            <div className="bg-zinc-800 rounded-2xl p-4 flex items-center gap-4">
              <div className="relative w-24 h-24 flex-shrink-0">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  {/* Background circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#3f3f46" /* zinc-700 */
                    strokeWidth="6"
                  />
                  {/* Progress circle with gradient */}
                  <defs>
                    <linearGradient id="insuranceGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="25%" stopColor="rgba(99, 36, 135, 1)" />
                      <stop offset="100%" stopColor="rgba(105, 187, 238, 1)" />
                    </linearGradient>
                  </defs>
                  {/* Progress circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="url(#insuranceGradient1)"
                    strokeWidth="6"
                    strokeDasharray="251" // 2 * π * 40
                    strokeDashoffset={251 - (251 * (civilStatusInsurancePercentage / 100))}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-zinc-300">
                  {familyProfileTranslations[mostCommonCivilStatus] || mostCommonCivilStatus}
                </h4>
                <span className="text-2xl font-bold" style={{ color: '#69BBEE' }}>
                  {civilStatusInsurancePercentage}%
                </span>
              </div>
            </div>
            
            <div className="bg-zinc-800 rounded-2xl p-4 flex items-center gap-4">
              <div className="relative w-24 h-24 flex-shrink-0">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  {/* Background circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#3f3f46" /* zinc-700 */
                    strokeWidth="6"
                  />
                  {/* Progress circle with gradient */}
                  <defs>
                    <linearGradient id="insuranceGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="25%" stopColor="rgba(99, 36, 135, 1)" />
                      <stop offset="100%" stopColor="rgba(105, 187, 238, 1)" />
                    </linearGradient>
                  </defs>
                  {/* Progress circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="url(#insuranceGradient2)"
                    strokeWidth="6"
                    strokeDasharray="251" // 2 * π * 40
                    strokeDashoffset={251 - (251 * (childrenInsurancePercentage / 100))}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-zinc-300">
                  Com filhos
                </h4>
                <span className="text-2xl font-bold" style={{ color: '#69BBEE' }}>
                  {childrenInsurancePercentage}%
                </span>
              </div>
            </div>
            
            <div className="bg-zinc-800 rounded-2xl p-4 flex items-center gap-4">
              <div className="relative w-24 h-24 flex-shrink-0">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  {/* Background circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#3f3f46" /* zinc-700 */
                    strokeWidth="6"
                  />
                  {/* Progress circle with gradient */}
                  <defs>
                    <linearGradient id="insuranceGradient3" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="25%" stopColor="rgba(99, 36, 135, 1)" />
                      <stop offset="100%" stopColor="rgba(105, 187, 238, 1)" />
                    </linearGradient>
                  </defs>
                  {/* Progress circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="url(#insuranceGradient3)"
                    strokeWidth="6"
                    strokeDasharray="251" // 2 * π * 40
                    strokeDashoffset={251 - (251 * (dependantsInsurancePercentage / 100))}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-zinc-300">
                  Com dependentes
                </h4>
                <span className="text-2xl font-bold" style={{ color: '#69BBEE' }}>
                  {dependantsInsurancePercentage}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-6 md:col-span-2">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">Lista de Clientes</h3>
            <p className="text-sm text-zinc-400">
              Visualize e gerencie todos os seus clientes
            </p>
            <div className="flex items-center space-x-2 mt-2">
              <Search className="h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Buscar clientes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500"
              />
            </div>
          </div>
          <div className="rounded-xl border border-zinc-800">
            {isLoading ? (
              <div className="space-y-4 p-4">
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
                  <TableRow className="hover:bg-zinc-800 border-zinc-800">
                    <TableHead className="text-zinc-300">Nome</TableHead>
                    <TableHead className="text-zinc-300">Patrimônio</TableHead>
                    <TableHead className="text-zinc-300">Status</TableHead>
                    <TableHead className="text-right text-zinc-300">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client: Client) => (
                    <TableRow key={client.id} className="hover:bg-zinc-800 border-zinc-800">
                      <TableCell className="font-medium text-white">{client.name}</TableCell>
                      <TableCell className="text-zinc-300">{formatCurrency(client.totalWealth || 0)}</TableCell>
                      <TableCell>
                        <Badge variant={client.active ? "default" : "secondary"}>
                          {client.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white hover:bg-zinc-700">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-zinc-400 hover:text-white hover:bg-zinc-700"
                            onClick={() => handleEditClient(client)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-zinc-400 hover:text-white hover:bg-zinc-700"
                            onClick={() => client.id && handleDeleteClient(client.id, client.name)}
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

            {!isLoading && clients.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-white">Nenhum cliente encontrado</h3>
                <p className="text-zinc-400 mb-4">
                  {search ? "Tente ajustar os termos de busca" : "Comece adicionando seu primeiro cliente"}
                </p>
                <Button 
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Cliente
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
