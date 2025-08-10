import { useEffect, useState } from 'react'

/**
 * Hook para garantir que código só execute no cliente
 * Evita problemas de hidratação do SSR
 */
export function useClientOnly() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return isClient
}

/**
 * Hook para valores que dependem do localStorage
 * Retorna valor padrão durante SSR e valor real no cliente
 */
export function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const isClient = useClientOnly()
  
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return defaultValue
    }
    
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  })

  const setStoredValue = (newValue: T) => {
    setValue(newValue)
    
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify(newValue))
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error)
      }
    }
  }

  // Sincronizar com localStorage quando o componente monta no cliente
  useEffect(() => {
    if (isClient) {
      try {
        const item = localStorage.getItem(key)
        if (item) {
          setValue(JSON.parse(item))
        }
      } catch (error) {
        console.error(`Error reading localStorage key "${key}":`, error)
      }
    }
  }, [isClient, key])

  return [value, setStoredValue]
}
