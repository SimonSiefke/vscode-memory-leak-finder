import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { CompiledCodeSizeChartLimit } from '../CompiledCodeSizeChartLimit/CompiledCodeSizeChartLimit.ts'
import { readJson } from '../ReadJson/ReadJson.ts'

interface CodeSizeBreakdown {
  readonly bytecodeBytes?: number
  readonly instructionBytes?: number
  readonly metadataBytes?: number
  readonly totalBytes?: number
}

interface CompiledCodeRow {
  readonly after?: CodeSizeBreakdown
  readonly before?: CodeSizeBreakdown
  readonly delta?: CodeSizeBreakdown
  readonly name?: string
  readonly originalLocation?: string
  readonly originalName?: string | null
  readonly source?: string
  readonly sourceLocation?: string
}

interface ChartRow {
  readonly after: CodeSizeBreakdown
  readonly before: CodeSizeBreakdown
  readonly delta: CodeSizeBreakdown
  readonly name: string
}

const emptyBreakdown: CodeSizeBreakdown = {
  bytecodeBytes: 0,
  instructionBytes: 0,
  metadataBytes: 0,
  totalBytes: 0,
}

const addBreakdown = (left: CodeSizeBreakdown, right: CodeSizeBreakdown): CodeSizeBreakdown => ({
  bytecodeBytes: (left.bytecodeBytes || 0) + (right.bytecodeBytes || 0),
  instructionBytes: (left.instructionBytes || 0) + (right.instructionBytes || 0),
  metadataBytes: (left.metadataBytes || 0) + (right.metadataBytes || 0),
  totalBytes: (left.totalBytes || 0) + (right.totalBytes || 0),
})

const normalizeBreakdown = (value: CodeSizeBreakdown | undefined): CodeSizeBreakdown => ({
  bytecodeBytes: value?.bytecodeBytes || 0,
  instructionBytes: value?.instructionBytes || 0,
  metadataBytes: value?.metadataBytes || 0,
  totalBytes: value?.totalBytes || 0,
})

const removeLocationSuffix = (location: string): string => {
  return location.replace(/:\d+:\d+$/, '')
}

const shorten = (value: string, maxLength: number): string => {
  if (value.length <= maxLength) {
    return value
  }
  return `...${value.slice(-(maxLength - 3))}`
}

const cleanGeneratedLocation = (location: string): string => {
  return location.replace(/^.*\/resources\/app\//, '')
}

const getFunctionLabel = (item: CompiledCodeRow): string => {
  const name = shorten(item.originalName || item.name || '(anonymous)', 36)
  const location = item.originalLocation || item.sourceLocation
  if (!location) {
    return name
  }
  return `${name} (${shorten(cleanGeneratedLocation(location), 58)})`
}

const getSource = (item: CompiledCodeRow): string => {
  if (item.source) {
    return item.source
  }
  const location = item.originalLocation || item.sourceLocation
  return location ? removeLocationSuffix(location) : 'Unknown'
}

const toChartRow = (item: CompiledCodeRow, name: string): ChartRow => ({
  after: normalizeBreakdown(item.after),
  before: normalizeBreakdown(item.before),
  delta: normalizeBreakdown(item.delta),
  name,
})

const getComparison = (rawData: any): any => {
  return rawData?.compiledCodeSize || rawData
}

const getFiles = (comparison: any): readonly CompiledCodeRow[] => {
  if (Array.isArray(comparison?.largestFiles)) {
    return comparison.largestFiles
  }
  const files = new Map<string, ChartRow>()
  for (const item of comparison?.largestFunctions || []) {
    const source = getSource(item)
    const existing = files.get(source) || toChartRow({}, source)
    files.set(source, {
      after: addBreakdown(existing.after, item.after || emptyBreakdown),
      before: addBreakdown(existing.before, item.before || emptyBreakdown),
      delta: addBreakdown(existing.delta, item.delta || emptyBreakdown),
      name: source,
    })
  }
  return [...files.values()].map((item) => ({ ...item, source: item.name }))
}

const getData = async (
  basePath: string,
  getRows: (comparison: any) => readonly CompiledCodeRow[],
  getName: (row: CompiledCodeRow) => string,
  getTotalCount: (comparison: any, rows: readonly CompiledCodeRow[]) => number,
) => {
  const resultsPath = join(basePath, 'compiled-code-size')
  if (!existsSync(resultsPath)) {
    return []
  }
  const allData = []
  const dirents = (await readdir(resultsPath)).filter((dirent) => dirent.endsWith('.json')).toSorted()
  for (const dirent of dirents) {
    const comparison = getComparison(await readJson(join(resultsPath, dirent)))
    const rows = getRows(comparison)
    const chartRows = rows
      .map((row) => toChartRow(row, getName(row)))
      .toSorted((a, b) => (b.after.totalBytes || 0) - (a.after.totalBytes || 0) || a.name.localeCompare(b.name))
    const limitedData = chartRows.slice(0, CompiledCodeSizeChartLimit)
    allData.push({
      data: limitedData,
      filename: dirent.replace('.json', ''),
      omittedEntryCount: Math.max(0, getTotalCount(comparison, rows) - limitedData.length),
    })
  }
  return allData
}

export const getCompiledCodeSizeByFunctionData = async (basePath: string) => {
  return getData(
    basePath,
    (comparison) => comparison?.largestFunctions || [],
    getFunctionLabel,
    (comparison, rows) => comparison?.functionCount || rows.length,
  )
}

export const getCompiledCodeSizeByFileData = async (basePath: string) => {
  return getData(
    basePath,
    getFiles,
    (item) => shorten(cleanGeneratedLocation(getSource(item)), 92),
    (comparison, rows) => comparison?.sourceFileCount || rows.length,
  )
}
