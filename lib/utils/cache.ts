const STORAGE_PREFIX = 'gymcal:cache:'

interface CacheEntry<T> {
  value: T
  timestamp: number
}

function getStorageKey(key: string) {
  return `${STORAGE_PREFIX}${key}`
}

export function readCache<T>(key: string): CacheEntry<T> | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(getStorageKey(key))
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as CacheEntry<T> | T

    if (parsed && typeof parsed === 'object' && 'value' in parsed && 'timestamp' in parsed) {
      return parsed as CacheEntry<T>
    }

    return {
      value: parsed as T,
      timestamp: Date.now(),
    }
  } catch (error) {
    console.error('Failed to read cache for key', key, error)
    window.localStorage.removeItem(getStorageKey(key))
    return null
  }
}

export function writeCache<T>(key: string, value: T): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
    }

    window.localStorage.setItem(getStorageKey(key), JSON.stringify(entry))
  } catch (error) {
    console.error('Failed to write cache for key', key, error)
  }
}

export function clearCache(key: string): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(getStorageKey(key))
}
