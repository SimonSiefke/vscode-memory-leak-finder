import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { readJson } from '../ReadJson/ReadJson.ts'

type TrackedAllocation = {
  readonly collectedCount?: number
  readonly createdCount?: number
  readonly location?: string
  readonly originalLocation?: string
  readonly originalSource?: string
}

type AllocationFileCounts = {
  collected: number
  created: number
  name: string
}

const getSourceName = (item: TrackedAllocation): string => {
  return item.originalSource || item.originalLocation || item.location || 'Unknown'
}

const getTrackedAllocations = (rawData: any): readonly TrackedAllocation[] => {
  if (Array.isArray(rawData)) {
    return rawData
  }
  if (Array.isArray(rawData.trackedAllocations)) {
    return rawData.trackedAllocations
  }
  return []
}

const getAllocationFileCounts = (trackedAllocations: readonly TrackedAllocation[]): readonly AllocationFileCounts[] => {
  const countsBySource = new Map<string, AllocationFileCounts>()
  for (const item of trackedAllocations) {
    const name = getSourceName(item)
    const existing = countsBySource.get(name) || {
      collected: 0,
      created: 0,
      name,
    }
    existing.collected += item.collectedCount || 0
    existing.created += item.createdCount || 0
    countsBySource.set(name, existing)
  }
  return [...countsBySource.values()].sort((a, b) => b.created - a.created || b.collected - a.collected).slice(0, 10_000)
}

export const getTrackedAllocationsByFileData = async (basePath: string) => {
  const resultsPath = join(basePath, 'tracked-allocations')
  if (!existsSync(resultsPath)) {
    return []
  }
  const dirents = await readdir(resultsPath)
  const allData: any[] = []
  for (const dirent of dirents.sort()) {
    if (!dirent.endsWith('.json')) {
      continue
    }
    const filePath = join(resultsPath, dirent)
    const rawData = await readJson(filePath)
    const trackedAllocations = getTrackedAllocations(rawData)
    allData.push({
      data: getAllocationFileCounts(trackedAllocations),
      filename: dirent.replace('.json', ''),
    })
  }
  return allData
}
