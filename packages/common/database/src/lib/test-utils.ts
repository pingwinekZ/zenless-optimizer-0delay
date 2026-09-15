import { DBLocalStorage } from './DBLocalStorage'
import type { StorageType } from './DBStorage'
import { SandboxStorage } from './SandboxStorage'

/**
 * Create a mock localStorage for testing.
 *
 * Stored keys are enumerable properties of the returned object, exactly like
 * the real `localStorage`, so code that enumerates it (`Object.keys`,
 * `for..in`, and therefore `DBLocalStorage.keys`/`entries`/`removeForKeys`)
 * sees them. The API methods themselves are non-enumerable, so they are not
 * mistaken for stored keys.
 */
export function createMockStorage() {
  const store: Record<string, string> = {}
  const define = (name: string, value: unknown) => {
    Object.defineProperty(store, name, { value, enumerable: false })
  }
  define('getItem', (key: string) => store[key] ?? null)
  define('setItem', (key: string, value: string) => {
    store[key] = value
  })
  define('removeItem', (key: string) => {
    delete store[key]
  })
  define('clear', () => {
    Object.keys(store).forEach((key) => delete store[key])
  })
  define('key', (index: number) => Object.keys(store)[index] ?? null)
  Object.defineProperty(store, 'length', {
    get: () => Object.keys(store).length,
    enumerable: false,
  })
  return store as unknown as Storage
}

/**
 * Create a DBLocalStorage for testing with isolated storage
 */
export function createTestDBStorage(storageType: StorageType = 'go') {
  const mockStorage = createMockStorage()
  return new DBLocalStorage(mockStorage, storageType)
}

/**
 * Create a SandboxStorage for testing (in-memory only)
 */
export function createTestSandboxStorage() {
  return new SandboxStorage()
}
