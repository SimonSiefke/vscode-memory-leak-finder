import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { readJson } from '../ReadJson/ReadJson.ts'
import { TrackedAllocationsChartLimit } from '../TrackedAllocationsChartLimit/TrackedAllocationsChartLimit.ts'

interface TrackedAllocationLeak {
  readonly aliveCount?: number
  readonly collectedCount?: number
  readonly createdCount?: number
  readonly location?: string
  readonly originalLocation?: string
  readonly type?: string
}

const getAllocations = (rawData: any): readonly TrackedAllocationLeak[] => {
  if (Array.isArray(rawData)) {
    return rawData
  }
  if (Array.isArray(rawData.trackedAllocationLeaks)) {
    return rawData.trackedAllocationLeaks
  }
  return []
}

export const getTrackedAllocationLeaksData = async (basePath: string) => {
  const resultsPath = join(basePath, 'tracked-allocation-leaks')
  if (!existsSync(resultsPath)) {
    return []
  }
  const allData = []
  const dirents = (await readdir(resultsPath)).filter((dirent) => dirent.endsWith('.json')).toSorted()
  for (const dirent of dirents) {
    const rawData = await readJson(join(resultsPath, dirent))
    const fileData = getAllocations(rawData)
      .filter((allocation) => (allocation.aliveCount || 0) > 0)
      .map((allocation) => ({
        count: allocation.createdCount || 0,
        delta: allocation.aliveCount || 0,
        name: `${allocation.type || 'Object'} ${allocation.originalLocation || allocation.location || 'Unknown'}`,
      }))
      .toSorted((a, b) => b.delta - a.delta || b.count - a.count || a.name.localeCompare(b.name))
    const limitedData = fileData.slice(0, TrackedAllocationsChartLimit)
    allData.push({
      data: limitedData,
      filename: dirent.replace('.json', ''),
      omittedEntryCount: fileData.length - limitedData.length,
    })
  }
  return allData
}
