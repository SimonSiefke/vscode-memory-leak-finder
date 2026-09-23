import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { readJson } from '../ReadJson/ReadJson.ts'

interface WindowsHandleGrowth {
  readonly afterHandles?: number
  readonly beforeHandles?: number
  readonly deltaHandles?: number
  readonly name?: string
  readonly pid?: number
}

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

export const getWindowsHandlesData = async (basePath: string) => {
  const resultsPath = join(basePath, 'windows-handles')
  if (!existsSync(resultsPath)) {
    return []
  }

  const entries = await readdir(resultsPath, { withFileTypes: true })
  const results = []
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) {
      continue
    }
    const rawData = await readJson(join(resultsPath, entry.name))
    const result = rawData.windowsHandles ?? rawData
    const data = (result.topGrowth || [])
      .filter(
        (process: WindowsHandleGrowth) =>
          isFiniteNumber(process.beforeHandles) &&
          isFiniteNumber(process.afterHandles) &&
          isFiniteNumber(process.deltaHandles) &&
          process.deltaHandles > 0,
      )
      .map((process: WindowsHandleGrowth) => ({
        count: process.afterHandles!,
        delta: process.deltaHandles!,
        name: `${process.name || 'Unknown process'} (PID ${process.pid ?? 'unknown'})`,
      }))
      .sort(
        (a: { count: number; delta: number; name: string }, b: { count: number; delta: number; name: string }) =>
          b.count - a.count || b.delta - a.delta || a.name.localeCompare(b.name),
      )
    results.push({
      data,
      filename: entry.name.slice(0, -'.json'.length),
    })
  }
  return results
}
