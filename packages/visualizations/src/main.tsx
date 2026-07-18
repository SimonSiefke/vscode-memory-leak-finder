import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'
import { TrackedEverythingApp } from './TrackedEverythingApp.tsx'
import { isMemoryCityDataset } from './model.ts'
import { sampleData } from './sampleData.ts'
import { isTrackedEverythingDataset } from './trackedEverythingModel.ts'
import type { TrackedEverythingDataset } from './trackedEverythingTypes.ts'
import type { MemoryCityDataset } from './types.ts'
import './styles.css'

declare global {
  var __MEMORY_CITY_DATA__: unknown
  var __TRACKED_EVERYTHING_DATA__: unknown
}

const loadDataset = async (): Promise<{ dataset: MemoryCityDataset | TrackedEverythingDataset; loadError?: string }> => {
  if (isTrackedEverythingDataset(globalThis.__TRACKED_EVERYTHING_DATA__)) {
    return { dataset: globalThis.__TRACKED_EVERYTHING_DATA__ }
  }
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
    {isTrackedEverythingDataset(dataset) ? <TrackedEverythingApp dataset={dataset} /> : <App dataset={dataset} loadError={loadError} />}
  </StrictMode>,
)
