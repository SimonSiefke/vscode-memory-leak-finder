import { readFile } from 'node:fs/promises'
import type { Dynamic } from '../Types/Types.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'

export interface SlabRow {
  readonly name: string
  readonly activeObjects: number
  readonly totalObjects: number
  readonly objectSize: number
  readonly activeBytes: number
  readonly capacityBytes: number
}

export const parseSlabinfo = (raw: string): readonly SlabRow[] => {
  const lines = raw.trim().split('\n')
  if (lines.shift()?.trim() !== 'slabinfo - version: 2.1') {
    throw new Error('Expected /proc/slabinfo version 2.1')
  }
  const names = new Set<string>()
  return lines
    .filter((line) => line.trim() && !line.startsWith('#'))
    .map((line) => {
      const [name, ...fields] = line.trim().split(/\s+/)
      const values = fields.slice(0, 5).map(Number)
      if (values.length !== 5 || values.some((value) => !Number.isSafeInteger(value) || value < 0) || names.has(name)) {
        throw new Error(`Invalid slabinfo row: ${line}`)
      }
      const [activeObjects, totalObjects, objectSize] = values
      if (activeObjects > totalObjects || objectSize === 0) {
        throw new Error(`Invalid slabinfo counts: ${line}`)
      }
      names.add(name)
      return {
        name,
        activeObjects,
        totalObjects,
        objectSize,
        activeBytes: activeObjects * objectSize,
        capacityBytes: totalObjects * objectSize,
      }
    })
}

export const id = MeasureId.LinuxSlabMemory
export const targets: readonly Dynamic[] = []
export const create = () => {
  if (process.platform !== 'linux') throw new Error('linux-slab-memory requires Linux')
  return []
}
export const start = async () => {
  // Permission failures must remain failures, rather than becoming empty snapshots.
  const raw = await readFile('/proc/slabinfo', 'utf8')
  return { capturedAt: new Date().toISOString(), rows: parseSlabinfo(raw), raw }
}
export const stop = start
export const releaseResources = () => undefined
export const compare = (before: Awaited<ReturnType<typeof start>>, after: Awaited<ReturnType<typeof start>>) => {
  const previous = new Map(before.rows.map((row) => [row.name, row]))
  const current = new Map(after.rows.map((row) => [row.name, row]))
  const rows = [...new Set([...previous.keys(), ...current.keys()])]
    .map((name) => {
      const a = previous.get(name)
      const b = current.get(name)
      return {
        name,
        beforeActiveBytes: a?.activeBytes ?? 0,
        afterActiveBytes: b?.activeBytes ?? 0,
        deltaActiveBytes: (b?.activeBytes ?? 0) - (a?.activeBytes ?? 0),
        deltaActiveObjects: (b?.activeObjects ?? 0) - (a?.activeObjects ?? 0),
        beforeCapacityBytes: a?.capacityBytes ?? 0,
        afterCapacityBytes: b?.capacityBytes ?? 0,
      }
    })
    .sort((a, b) => b.deltaActiveBytes - a.deltaActiveBytes)
  return { scope: 'system-wide', rows, snapshots: { before, after }, suspectedLeak: rows.some((row) => row.deltaActiveBytes >= 65536) }
}
export const isLeak = (result: ReturnType<typeof compare>) => result.suspectedLeak
export const summary = (result: ReturnType<typeof compare>) =>
  `System-wide slab active-object growth: ${result.rows.reduce((sum, row) => sum + row.deltaActiveBytes, 0)} bytes; ${result.rows.filter((row) => row.deltaActiveBytes > 0).length} growing caches (growth is not proof of a leak)`
