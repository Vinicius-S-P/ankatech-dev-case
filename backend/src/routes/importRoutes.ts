import { FastifyInstance } from 'fastify'
import { EventEmitter } from 'events'
import { prisma } from '../prisma'
import { GoalType, EventType, Frequency } from '@prisma/client'

interface ImportParams {
  clientId: string
}

class ImportProgress extends EventEmitter {
  updateProgress(current: number, total: number, message: string) {
    this.emit('progress', {
      current,
      total,
      percentage: Math.round((current / total) * 100),
      message,
      timestamp: new Date().toISOString()
    })
  }

  reportError(error: string) {
    this.emit('error', {
      error,
      timestamp: new Date().toISOString()
    })
  }

  reportComplete(summary: any) {
    this.emit('complete', {
      ...summary,
      timestamp: new Date().toISOString()
    })
  }
}

async function processCSVImport(clientId: string, progress: ImportProgress): Promise<void> {
  try {
    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    })

    if (!client) {
      progress.reportError('Cliente não encontrado')
      return
    }

    progress.updateProgress(0, 100, 'Iniciando importação...')

    // Simulate CSV processing steps
    const steps = [
      'Validando arquivo CSV...',
      'Lendo dados financeiros...',
      'Processando carteira de investimentos...',
      'Importando metas financeiras...',
      'Processando eventos...',
      'Calculando métricas...',
      'Finalizando importação...'
    ]

    let processedRecords = 0
    const totalSteps = steps.length

    for (let i = 0; i < totalSteps; i++) {
      const step = steps[i]
      progress.updateProgress(i + 1, totalSteps, step)

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 500))

      // Simulate data processing
      switch (i) {
        case 1: // Reading financial data
          processedRecords += 5
          break
        case 2: // Processing portfolio
          processedRecords += 8
          // Create sample wallet entries
          await createSampleWalletData(clientId)
          break
        case 3: // Importing goals
          processedRecords += 3
          // Create sample goals
          await createSampleGoalData(clientId)
          break
        case 4: // Processing events
          processedRecords += 4
          // Create sample events
          await createSampleEventData(clientId)
          break
        case 5: // Calculating metrics
          processedRecords += 2
          // Update client metrics
          await updateClientMetrics(clientId)
          break
      }
    }

    // Report completion
    progress.reportComplete({
      totalRecords: processedRecords,
      walletsCreated: 3,
      goalsCreated: 2,
      eventsCreated: 2,
      message: 'Importação concluída com sucesso!'
    })

  } catch (error: any) {
    progress.reportError(`Erro durante importação: ${error.message}`)
  }
}

async function createSampleWalletData(clientId: string) {
  const walletData = [
    {
      clientId,
      assetClass: 'STOCKS' as const,
      description: 'Ações Nacionais',
      currentValue: 50000,
      percentage: 45
    },
    {
      clientId,
      assetClass: 'BONDS' as const,
      description: 'Títulos Públicos',
      currentValue: 30000,
      percentage: 27
    },
    {
      clientId,
      assetClass: 'REAL_ESTATE' as const,
      description: 'Fundos Imobiliários',
      currentValue: 20000,
      percentage: 18
    }
  ]

  for (const wallet of walletData) {
    await prisma.wallet.create({ data: wallet })
  }
}

async function createSampleGoalData(clientId: string) {
  const goalData = [
    {
      clientId,
      type: GoalType.LONG_TERM,
      name: 'Aposentadoria',
      description: 'Acumular R$ 2.000.000 para aposentadoria',
      targetValue: 2000000,
      currentValue: 100000,
      targetDate: new Date('2050-12-31')
    },
    {
      clientId,
      type: GoalType.SHORT_TERM,
      name: 'Compra de Imóvel',
      description: 'Entrada para compra de imóvel',
      targetValue: 300000,
      currentValue: 75000,
      targetDate: new Date('2027-06-30')
    }
  ]

  for (const goal of goalData) {
    await prisma.goal.create({ data: goal })
  }
}

async function createSampleEventData(clientId: string) {
  const eventData = [
    {
      clientId,
      type: EventType.DEPOSIT,
      name: 'Contribuição mensal planejada',
      description: 'Contribuição mensal planejada',
      value: 3000,
      frequency: Frequency.MONTHLY,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2030-12-31')
    },
    {
      clientId,
      type: EventType.WITHDRAWAL,
      name: 'Retirada para emergência',
      description: 'Retirada para emergência',
      value: 15000,
      frequency: Frequency.ONCE,
      startDate: new Date('2025-06-01')
    }
  ]

  for (const event of eventData) {
    await prisma.event.create({ data: event })
  }
}

async function updateClientMetrics(clientId: string) {
  const wallets = await prisma.wallet.findMany({
    where: { clientId }
  })

  const totalWealth = wallets.reduce((sum, wallet) => sum + wallet.currentValue, 0)

  const goals = await prisma.goal.findMany({
    where: { clientId }
  })

  const plannedWealth = goals.reduce((sum, goal) => sum + goal.targetValue, 0);

  const alignmentPercentage = totalWealth > 0 ? (totalWealth / plannedWealth) * 100 : 0;

  await prisma.client.update({
    where: { id: clientId },
    data: {
      totalWealth,
      alignmentPercentage
    }
  })
}

export default async function importRoutes(fastify: FastifyInstance) {
  fastify.get('/csv-import/:clientId', {
    schema: {
      params: {
        type: 'object',
        properties: {
          clientId: { type: 'string' }
        },
        required: ['clientId']
      }
    }
  }, async (request, reply) => {
    const { clientId } = request.params as ImportParams;

    // Set SSE headers
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    })

    const progress = new ImportProgress()
    
    progress.on('progress', (data) => {
      reply.raw.write(`data: ${JSON.stringify({ type: 'progress', ...data })}\n\n`)
    })

    progress.on('error', (data) => {
      reply.raw.write(`data: ${JSON.stringify({ type: 'error', ...data })}\n\n`)
      reply.raw.end()
    })

    progress.on('complete', (data) => {
      reply.raw.write(`data: ${JSON.stringify({ type: 'complete', ...data })}\n\n`)
      reply.raw.end()
    })

    request.raw.on('close', () => {
      reply.raw.end()
    })

    await processCSVImport(clientId, progress)
  })

  // Traditional endpoint for file upload (if needed)
  fastify.post('/upload-csv/:clientId', {
    schema: {
      params: {
        type: 'object',
        properties: {
          clientId: { type: 'string' }
        },
        required: ['clientId']
      }
    }
  }, async (request, reply) => {
    try {
      const { clientId } = request.params as ImportParams;

      const client = await prisma.client.findUnique({
        where: { id: clientId }
      })

      if (!client) {
        return reply.status(404).send({ error: 'Cliente não encontrado' })
      }

      reply.send({
        message: 'Upload iniciado. Use o endpoint SSE para acompanhar o progresso.',
        importId: `import_${clientId}_${Date.now()}`
      })

    } catch (error: any) {
      reply.status(500).send({ error: error.message })
    }
  })
}
