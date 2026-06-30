import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { readJson } from '../ReadJson/ReadJson.ts'

interface PaintEvent {
  readonly durationMs?: number
  readonly index?: number
  readonly startMs?: number
  readonly totalArea?: number
}

const MaxPaintEvents = 50

const toChartRow = (event: PaintEvent) => {
  const index = event.index || 0
  const startMs = event.startMs || 0
  const durationMs = event.durationMs || 0
  return {
    name: `#${index} @ ${startMs}ms (${durationMs}ms)`,
    value: event.totalArea || 0,
  }
}

export const getPaintEventsData = async (basePath: string): Promise<any[]> => {
  const resultsPath = join(basePath, 'paint-events')
  if (!existsSync(resultsPath)) {
    return []
  }
  const dirents = await readdir(resultsPath)
  const allData: any[] = []
  for (const dirent of dirents.toSorted()) {
    const absolutePath = join(resultsPath, dirent)
    const rawData = await readJson(absolutePath)
    const events = rawData.paintEvents?.events || []
    const data = events
      .filter((event: PaintEvent) => typeof event.totalArea === 'number')
      .toSorted(
        (a: PaintEvent, b: PaintEvent) =>
          (b.totalArea || 0) - (a.totalArea || 0) || (b.durationMs || 0) - (a.durationMs || 0) || (a.index || 0) - (b.index || 0),
      )
      .slice(0, MaxPaintEvents)
      .map(toChartRow)
    allData.push({
      data,
      filename: dirent.replace('.json', ''),
    })
  }
  return allData
}
