import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import prettyBytes from 'pretty-bytes'
import { readJson } from '../ReadJson/ReadJson.ts'

interface ProcessTotals {
  readonly peakResidentSetBytes?: number | null
  readonly privateFootprintBytes?: number | null
}

interface ProcessComparison {
  readonly after?: ProcessTotals | null
  readonly before?: ProcessTotals | null
  readonly delta?: ProcessTotals
  readonly displayName?: string
  readonly isInspected?: boolean
  readonly name?: string
  readonly pid?: number
}

interface AllocatorComparison {
  readonly deltaBytes?: number | null
  readonly metric?: string
  readonly path?: string
  readonly pid?: number
  readonly processName?: string
  readonly selectedAfterBytes?: number | null
  readonly selectedBeforeBytes?: number | null
}

interface ChromiumMemoryDumpResult {
  readonly allocators?: readonly AllocatorComparison[]
  readonly complete?: boolean
  readonly processes?: readonly ProcessComparison[]
  readonly supported?: boolean
}

interface MemoryComparisonRow {
  readonly afterBytes: number
  readonly beforeBytes: number
  readonly deltaBytes: number
  readonly detail: string
  readonly isInspected?: boolean
  readonly name: string
}

const allocatorRowLimit = 40

const getResult = (rawData: any): ChromiumMemoryDumpResult => rawData.chromiumMemoryDump || rawData

const isUsableResult = (result: ChromiumMemoryDumpResult): boolean => result.supported === true && result.complete === true

const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

const formatBytes = (value: number | null | undefined): string => {
  if (!isNumber(value)) {
    return 'unavailable'
  }
  return prettyBytes(value, { binary: true })
}

const getProcessRows = (result: ChromiumMemoryDumpResult): { data: MemoryComparisonRow[]; omittedEntryCount: number } => {
  const processes = result.processes || []
  const data: MemoryComparisonRow[] = []
  for (const process of processes) {
    const rawBeforeBytes = process.before?.privateFootprintBytes
    const rawAfterBytes = process.after?.privateFootprintBytes
    if (!isNumber(rawBeforeBytes) && !isNumber(rawAfterBytes)) {
      continue
    }
    const beforeBytes = isNumber(rawBeforeBytes) ? rawBeforeBytes : 0
    const afterBytes = isNumber(rawAfterBytes) ? rawAfterBytes : 0
    const peakBefore = process.before?.peakResidentSetBytes
    const peakAfter = process.after?.peakResidentSetBytes
    const peakText =
      isNumber(peakBefore) || isNumber(peakAfter)
        ? `Peak RSS: ${formatBytes(peakBefore)} → ${formatBytes(peakAfter)}`
        : 'Peak RSS unavailable'
    data.push({
      afterBytes,
      beforeBytes,
      deltaBytes: afterBytes - beforeBytes,
      detail: `${peakText}; PID ${process.pid ?? 'unknown'}`,
      isInspected: process.isInspected === true,
      name: `${process.name || 'Unknown process'} (PID ${process.pid ?? 'unknown'})`,
    })
  }
  data.sort((a, b) => Math.abs(b.deltaBytes) - Math.abs(a.deltaBytes) || b.afterBytes - a.afterBytes)
  return {
    data,
    omittedEntryCount: processes.length - data.length,
  }
}

const getAllocatorRows = (result: ChromiumMemoryDumpResult): { data: MemoryComparisonRow[]; omittedEntryCount: number } => {
  const allocators = result.allocators || []
  const comparable: MemoryComparisonRow[] = []
  let missingEntryCount = 0
  for (const allocator of allocators) {
    if (
      !allocator.metric ||
      !isNumber(allocator.selectedBeforeBytes) ||
      !isNumber(allocator.selectedAfterBytes) ||
      !isNumber(allocator.deltaBytes)
    ) {
      missingEntryCount++
      continue
    }
    comparable.push({
      afterBytes: allocator.selectedAfterBytes,
      beforeBytes: allocator.selectedBeforeBytes,
      deltaBytes: allocator.deltaBytes,
      detail: `${allocator.processName || 'Unknown process'}; PID ${allocator.pid ?? 'unknown'}; ${allocator.metric}`,
      name: `${allocator.processName || 'Unknown process'} (PID ${allocator.pid ?? 'unknown'}) — ${allocator.path || '(unnamed allocator)'}`,
    })
  }
  comparable.sort((a, b) => Math.abs(b.deltaBytes) - Math.abs(a.deltaBytes) || a.name.localeCompare(b.name))
  const data = comparable.slice(0, allocatorRowLimit)
  return {
    data,
    omittedEntryCount: missingEntryCount + comparable.length - data.length,
  }
}

const getData = async (
  basePath: string,
  getRows: (result: ChromiumMemoryDumpResult) => { data: MemoryComparisonRow[]; omittedEntryCount: number },
): Promise<any[]> => {
  const resultsPath = join(basePath, 'chromium-memory-dump')
  if (!existsSync(resultsPath)) {
    return []
  }
  const dirents = await readdir(resultsPath)
  const allData: any[] = []
  for (const dirent of dirents.toSorted()) {
    const rawData = await readJson(join(resultsPath, dirent))
    const result = getResult(rawData)
    if (!isUsableResult(result)) {
      continue
    }
    const rows = getRows(result)
    allData.push({
      ...rows,
      filename: dirent.replace(/\.json$/, ''),
    })
  }
  return allData
}

export const getChromiumMemoryDumpProcessData = (basePath: string): Promise<any[]> => getData(basePath, getProcessRows)

export const getChromiumMemoryDumpAllocatorData = (basePath: string): Promise<any[]> => getData(basePath, getAllocatorRows)
