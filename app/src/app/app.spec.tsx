import { render } from '@testing-library/react'
import App from './App'

const createMockStorage = () => {
  const store: Record<string, string> = {}
  return {
    getItem: (key: string) => {
      if (key === 'zzz_dbIndex') return '1'
      return store[key] ?? null
    },
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      Object.keys(store).forEach((key) => delete store[key])
    },
    get length() {
      return Object.keys(store).length
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
  }
}
const mockStorage = createMockStorage()

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
  Object.defineProperty(window, 'localStorage', { value: mockStorage })
}

if (typeof document !== 'undefined') {
  describe('App', () => {
    it('should render successfully', () => {
      const { baseElement } = render(<App />)
      expect(baseElement).toBeTruthy()
    })
  })
}
