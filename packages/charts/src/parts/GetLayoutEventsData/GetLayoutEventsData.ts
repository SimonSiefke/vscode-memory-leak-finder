import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { readJson } from '../ReadJson/ReadJson.ts'

interface LayoutEvent {
  readonly durationMs?: number
  readonly index?: number
  readonly startMs?: number
}

const MaxLayoutEvents = 50

const toChartRow = (event: LayoutEvent) => {
  const index = event.index || 0
  const startMs = event.startMs || 0
  return {
    name: `#${index} @ ${startMs}ms`,
    value: event.durationMs || 0,
  }
}

export const getLayoutEventsData = async (basePath: string): Promise<any[]> => {
  const resultsPath = join(basePath, 'layout-events')
  if (!existsSync(resultsPath)) {
    return []
  }
  const dirents = await readdir(resultsPath)
  const allData: any[] = []
  for (const dirent of dirents.toSorted()) {
    const absolutePath = join(resultsPath, dirent)
    const rawData = await readJson(absolutePath)
    const events = rawData.layoutEvents?.events || []
    const data = events
      .filter((event: LayoutEvent) => typeof event.durationMs === 'number')
      .toSorted((a: LayoutEvent, b: LayoutEvent) => (b.durationMs || 0) - (a.durationMs || 0) || (a.index || 0) - (b.index || 0))
      .slice(0, MaxLayoutEvents)
      .map(toChartRow)
    allData.push({
      data,
      filename: dirent.replace('.json', ''),
    })
  }
  return allData
}
