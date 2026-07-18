import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'
import { isMemoryCityDataset } from './model.ts'
import { sampleData } from './sampleData.ts'
import type { MemoryCityDataset } from './types.ts'
import './styles.css'

declare global {
  var __MEMORY_CITY_DATA__: unknown
}

const loadDataset = async (): Promise<{ dataset: MemoryCityDataset; loadError?: string }> => {
  if (isMemoryCityDataset(globalThis.__MEMORY_CITY_DATA__)) {
    return { dataset: globalThis.__MEMORY_CITY_DATA__ }
  }
  try {
    const response = await fetch('./memory-city.json', { cache: 'no-store' })
    if (!response.ok) {
      throw new Error(`dataset request returned ${response.status}`)
    }
    if (response.headers.get('content-type')?.includes('text/html')) {
      return { dataset: sampleData }
    }
    const value = await response.json()
    if (!isMemoryCityDataset(value)) {
      throw new Error('dataset schema is not supported')
    }
    return { dataset: value }
  } catch (error) {
    return {
      dataset: sampleData,
      loadError: error instanceof Error ? error.message : String(error),
    }
  }
}

const { dataset, loadError } = await loadDataset()
const root = document.getElementById('root')
if (!root) {
  throw new Error('Missing application root')
}
createRoot(root).render(
  <StrictMode>
    <App dataset={dataset} loadError={loadError} />
  </StrictMode>,
)
