import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { readdir } from 'node:fs/promises'
import { readJson } from '../ReadJson/ReadJson.ts'

export const getTrackedFunctionsData = async (basePath: string) => {
  const resultsPath = join(basePath, 'tracked-functions')
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
      const data = await readJson(filePath)
      const trackedFunctions = Array.isArray(data) ? data : data.trackedFunctions || []
      for (const item of trackedFunctions) {
        const displayName = item.originalName || item.functionName || 'Unknown'
        const count = item.totalCount || item.callCount || 0
        const delta = item.delta || 0
        allData.push({
          name: displayName,
          count: count,
          delta: delta,
        })
      }
    }
  } catch (error) {
    console.error('Error reading tracked functions data:', error)
    return []
  }
  allData.sort((a, b) => b.count - a.count)
  // Limit to top 100 functions for readability
  return allData.slice(0, 100)
}
