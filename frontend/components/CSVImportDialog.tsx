"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { useCSVImport } from "@/hooks/useCSVImport"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, XCircle, Upload, X } from "lucide-react"
import { toast } from "sonner"

interface CSVImportDialogProps {
  clientId: string
  clientName: string
  onImportComplete?: () => void
}

export function CSVImportDialog({ 
  clientId, 
  clientName, 
  onImportComplete 
}: CSVImportDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { 
    progress, 
    error, 
    complete, 
    isImporting, 
    startImport, 
    cancelImport, 
    resetState 
  } = useCSVImport()

  const handleStartImport = () => {
    resetState()
    startImport(clientId)
  }

  const handleCloseDialog = () => {
    if (isImporting) {
      cancelImport()
    }
    setIsOpen(false)
    resetState()
    
    if (complete && onImportComplete) {
      onImportComplete()
    }
  }

  const handleCancel = () => {
    cancelImport()
    toast.info("Importação cancelada")
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Importar Dados CSV
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Importação de Dados CSV</DialogTitle>
          <DialogDescription>
            Importar dados financeiros para o cliente: <strong>{clientName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!isImporting && !progress && !error && !complete && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>Esta funcionalidade irá importar:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Dados da carteira de investimentos</li>
                  <li>Metas financeiras</li>
                  <li>Eventos financeiros planejados</li>
                  <li>Métricas de alinhamento</li>
                </ul>
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsOpen(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleStartImport}>
                  Iniciar Importação
                </Button>
              </div>
            </div>
          )}

          {isImporting && (
            <div className="space-y-4">
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-blue-800">
                        Importação em Andamento
                      </h4>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={handleCancel}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {progress && (
                      <>
                        <Progress 
                          value={progress.percentage} 
                          className="w-full"
                        />
                        <div className="space-y-2">
                          <p className="text-sm text-blue-700">
                            {progress.message}
                          </p>
                          <div className="flex justify-between text-xs text-blue-600">
                            <span>
                              {progress.current}/{progress.total} etapas
                            </span>
                            <span>
                              {progress.percentage}%
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {error && (
            <div className="space-y-4">
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-red-800">
                    <XCircle className="h-5 w-5" />
                    <div>
                      <h4 className="font-medium">Erro na Importação</h4>
                      <p className="text-sm mt-1">{error.error}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={handleCloseDialog}
                >
                  Fechar
                </Button>
                <Button onClick={handleStartImport}>
                  Tentar Novamente
                </Button>
              </div>
            </div>
          )}

          {complete && (
            <div className="space-y-4">
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="h-5 w-5" />
                      <h4 className="font-medium">Importação Concluída</h4>
                    </div>
                    
                    <p className="text-sm text-green-700">
                      {complete.message}
                    </p>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total de registros:</span>
                        <span className="ml-2 font-medium">{complete.totalRecords}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Carteiras criadas:</span>
                        <span className="ml-2 font-medium">{complete.walletsCreated}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Metas criadas:</span>
                        <span className="ml-2 font-medium">{complete.goalsCreated}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Eventos criados:</span>
                        <span className="ml-2 font-medium">{complete.eventsCreated}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={handleCloseDialog}>
                  Concluir
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
