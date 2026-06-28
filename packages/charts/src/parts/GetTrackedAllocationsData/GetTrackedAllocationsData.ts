import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { readJson } from '../ReadJson/ReadJson.ts'

export const getTrackedAllocationsData = async (basePath: string) => {
  const resultsPath = join(basePath, 'tracked-allocations')
  if (!existsSync(resultsPath)) {
    return []
  }
  const allData: any[] = []
  try {
    const dirents = await readdir(resultsPath)
    for (const dirent of dirents) {
      if (!dirent.endsWith('.json')) {
        continue
      }
      const filePath = join(resultsPath, dirent)
      const rawData = await readJson(filePath)
      const trackedAllocations = Array.isArray(rawData) ? rawData : rawData.trackedAllocations || []
      const fileData = trackedAllocations.map((item: any) => {
        const location = item.originalLocation || item.location || 'Unknown'
        return {
          count: item.createdCount || 0,
          delta: item.collectedCount || 0,
          name: `${item.type || 'Object'} ${location}`,
        }
      })
      fileData.sort((a: any, b: any) => b.delta - a.delta || b.count - a.count)
      allData.push({
        data: fileData.slice(0, 10_000),
        filename: dirent.replace('.json', ''),
      })
    }
  } catch (error) {
    console.error('Error reading tracked allocations data:', error)
    return []
  }
  return allData
}
