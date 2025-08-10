import { useState, useCallback, useRef } from 'react'

export interface ImportProgress {
  current: number
  total: number
  percentage: number
  message: string
  timestamp: string
}

export interface ImportError {
  error: string
  timestamp: string
}

export interface ImportComplete {
  totalRecords: number
  walletsCreated: number
  goalsCreated: number
  eventsCreated: number
  message: string
  timestamp: string
}

export interface ImportState {
  progress: ImportProgress | null
  error: ImportError | null
  complete: ImportComplete | null
  isImporting: boolean
}

export function useCSVImport() {
  const [state, setState] = useState<ImportState>({
    progress: null,
    error: null,
    complete: null,
    isImporting: false
  })

  const eventSourceRef = useRef<EventSource | null>(null)

  const startImport = useCallback((clientId: string) => {
    setState({
      progress: null,
      error: null,
      complete: null,
      isImporting: true
    })

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const eventSource = new EventSource(
      `${process.env.NEXT_PUBLIC_API_URL}/api/import/csv-import/${clientId}`
    )

    eventSourceRef.current = eventSource

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        switch (data.type) {
          case 'progress':
            setState(prev => ({
              ...prev,
              progress: {
                current: data.current,
                total: data.total,
                percentage: data.percentage,
                message: data.message,
                timestamp: data.timestamp
              }
            }))
            break

          case 'error':
            setState(prev => ({
              ...prev,
              error: {
                error: data.error,
                timestamp: data.timestamp
              },
              isImporting: false
            }))
            eventSource.close()
            break

          case 'complete':
            setState(prev => ({
              ...prev,
              complete: {
                totalRecords: data.totalRecords,
                walletsCreated: data.walletsCreated,
                goalsCreated: data.goalsCreated,
                eventsCreated: data.eventsCreated,
                message: data.message,
                timestamp: data.timestamp
              },
              isImporting: false
            }))
            eventSource.close()
            break
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error)
        setState(prev => ({
          ...prev,
          error: {
            error: 'Erro ao processar dados de importação',
            timestamp: new Date().toISOString()
          },
          isImporting: false
        }))
        eventSource.close()
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE error:', error)
      setState(prev => ({
        ...prev,
        error: {
          error: 'Erro de conexão durante importação',
          timestamp: new Date().toISOString()
        },
        isImporting: false
      }))
      eventSource.close()
    }

  }, [])

  const cancelImport = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    setState(prev => ({
      ...prev,
      isImporting: false
    }))
  }, [])

  const resetState = useCallback(() => {
    setState({
      progress: null,
      error: null,
      complete: null,
      isImporting: false
    })
  }, [])

  return {
    ...state,
    startImport,
    cancelImport,
    resetState
  }
}
