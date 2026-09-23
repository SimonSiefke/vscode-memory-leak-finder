import { execFile, execFileSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { promisify } from 'node:util'
import type { Dynamic } from '../Types/Types.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'

const execFileAsync = promisify(execFile)
const DefaultLeakThresholdBytes = 64 * 1024
const MaxRows = 100

export interface PoolmonRow {
  readonly tag: string
  readonly type: string
  readonly allocs: number
  readonly frees: number
  readonly diff: number
  readonly bytes: number
  readonly bytesPerAlloc: number
  readonly mappedDriver: string
}

export interface ProcessMemoryRow {
  readonly imageName: string
  readonly pid: number
  readonly memoryKb: number
}

export interface PoolmonSnapshot {
  readonly capturedAt: string
  readonly poolmonPath: string
  readonly pooltagPath: string
  readonly raw: string
  readonly rows: readonly PoolmonRow[]
  readonly processes: readonly ProcessMemoryRow[]
  readonly processError: string
}

interface State {
  readonly poolmonPath: string
  readonly pooltagPath: string
}

const isFile = (path: string): boolean => {
  try {
    return existsSync(path)
  } catch {
    return false
  }
}

const getKnownToolsRoots = (): readonly string[] => {
  const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)'
  const programFiles = process.env.ProgramFiles || 'C:\\Program Files'
  return [join(programFilesX86, 'Windows Kits', '10', 'Tools'), join(programFiles, 'Windows Kits', '10', 'Tools')]
}

const getPathFromWhere = (): string => {
  try {
    const output = execFileSync('where.exe', ['poolmon.exe'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      windowsHide: true,
    })
    return (
      output
        .split(/\r?\n/)
        .map((line) => line.trim())
        .find(Boolean) || ''
    )
  } catch {
    return ''
  }
}

const getWdkPoolmonPaths = (): readonly string[] => {
  const paths: string[] = []
  for (const toolsRoot of getKnownToolsRoots()) {
    try {
      for (const entry of readdirSync(toolsRoot, { withFileTypes: true })) {
        if (entry.isDirectory()) {
          paths.push(join(toolsRoot, entry.name, 'x64', 'poolmon.exe'))
          paths.push(join(toolsRoot, entry.name, 'x86', 'poolmon.exe'))
        }
      }
    } catch {
      // The root is optional because PoolMon may be installed elsewhere.
    }
  }
  return paths
}

export const resolvePoolmonPath = (): string => {
  if (process.platform !== 'win32') {
    throw new Error('PoolMon measure is only supported on Windows')
  }
  const configuredPath = process.env.POOLMON_PATH
  if (configuredPath) {
    if (!isFile(configuredPath)) {
      throw new Error(`PoolMon was not found at POOLMON_PATH: ${configuredPath}`)
    }
    return configuredPath
  }
  const candidates = [getPathFromWhere(), ...getWdkPoolmonPaths()].filter(Boolean)
  const existing = candidates.filter(isFile)
  if (existing.length > 0) {
    return existing[0]
  }
  throw new Error('PoolMon is not installed. Install the Windows Driver Kit or set POOLMON_PATH.')
}

const resolvePooltagPath = (poolmonPath: string): string => {
  const configuredPath = process.env.POOLTAG_PATH
  if (configuredPath && isFile(configuredPath)) {
    return configuredPath
  }
  const kitRoot = dirname(dirname(dirname(dirname(poolmonPath))))
  const candidates = [
    join(kitRoot, 'Debuggers', 'x64', 'triage', 'pooltag.txt'),
    join(kitRoot, 'Debuggers', 'x86', 'triage', 'pooltag.txt'),
    ...getKnownToolsRoots().flatMap((toolsRoot) => {
      const windowsKitsRoot = dirname(toolsRoot)
      return [
        join(windowsKitsRoot, 'Debuggers', 'x64', 'triage', 'pooltag.txt'),
        join(windowsKitsRoot, 'Debuggers', 'x86', 'triage', 'pooltag.txt'),
      ]
    }),
  ]
  return candidates.find(isFile) || ''
}

const parseNumber = (value: string): number => {
  const number = Number(value.replaceAll(',', ''))
  return Number.isFinite(number) ? number : 0
}

const parseMemoryKilobytes = (value: string): number => {
  const number = Number(value.replace(/\D/g, ''))
  return Number.isFinite(number) ? number : 0
}

export const parsePoolmonRows = (raw: string): readonly PoolmonRow[] => {
  const rows: PoolmonRow[] = []
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\s*(.{4})\s+(Paged|Nonp)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)(?:\s+(.*?))?\s*$/)
    if (!match) {
      continue
    }
    rows.push({
      allocs: parseNumber(match[3]),
      bytes: parseNumber(match[6]),
      bytesPerAlloc: parseNumber(match[7]),
      diff: parseNumber(match[5]),
      frees: parseNumber(match[4]),
      mappedDriver: match[8]?.trim() || '',
      tag: match[1],
      type: match[2],
    })
  }
  return rows
}

const parseCsvLine = (line: string): readonly string[] => {
  const fields: string[] = []
  let field = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const character = line[i]
    if (character === '"') {
      if (quoted && line[i + 1] === '"') {
        field += '"'
        i++
      } else {
        quoted = !quoted
      }
    } else if (character === ',' && !quoted) {
      fields.push(field)
      field = ''
    } else {
      field += character
    }
  }
  fields.push(field)
  return fields
}

export const parseTasklist = (raw: string): readonly ProcessMemoryRow[] => {
  const processes: ProcessMemoryRow[] = []
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) {
      continue
    }
    const fields = parseCsvLine(line)
    const pid = Number(fields[1])
    const memoryKb = parseMemoryKilobytes(fields[4] || '')
    if (fields.length < 5 || !Number.isInteger(pid) || pid < 0 || memoryKb < 0) {
      continue
    }
    processes.push({
      imageName: fields[0],
      memoryKb,
      pid,
    })
  }
  return processes
}

const captureProcesses = async (): Promise<{ readonly processes: readonly ProcessMemoryRow[]; readonly error: string }> => {
  try {
    const { stdout } = await execFileAsync('tasklist.exe', ['/FO', 'CSV', '/NH'], {
      encoding: 'utf8',
      maxBuffer: 4 * 1024 * 1024,
      windowsHide: true,
    })
    return { error: '', processes: parseTasklist(stdout) }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error), processes: [] }
  }
}

const capturePoolmon = async (state: State): Promise<string> => {
  const directory = await mkdtemp(join(tmpdir(), 'vscode-memory-leak-finder-poolmon-'))
  const outputPath = join(directory, 'snapshot.log')
  const args = ['/n', outputPath, '/b']
  if (state.pooltagPath) {
    args.push('/g', state.pooltagPath)
  }
  try {
    await execFileAsync(state.poolmonPath, args, {
      encoding: 'utf8',
      maxBuffer: 4 * 1024 * 1024,
      timeout: 60_000,
      windowsHide: true,
    })
    return await readFile(outputPath, 'utf8')
  } catch (error) {
    throw new Error(`PoolMon snapshot failed: ${error instanceof Error ? error.message : String(error)}`)
  } finally {
    await rm(directory, { force: true, recursive: true })
  }
}

const capture = async (state: State): Promise<PoolmonSnapshot> => {
  const [raw, processSnapshot] = await Promise.all([capturePoolmon(state), captureProcesses()])
  return {
    capturedAt: new Date().toISOString(),
    poolmonPath: state.poolmonPath,
    pooltagPath: state.pooltagPath,
    processError: processSnapshot.error,
    processes: processSnapshot.processes,
    raw,
    rows: parsePoolmonRows(raw),
  }
}

interface PoolmonRowDelta extends PoolmonRow {
  readonly beforeBytes: number
  readonly deltaAllocs: number
  readonly deltaBytes: number
  readonly deltaDiff: number
  readonly deltaFrees: number
  readonly afterBytes: number
}

interface ProcessMemoryDelta {
  readonly imageName: string
  readonly pid: number
  readonly beforeMemoryKb: number
  readonly afterMemoryKb: number
  readonly deltaMemoryKb: number
}

const getRowKey = (row: PoolmonRow): string => `${row.type}:${row.tag}`

const getProcessDeltas = (before: PoolmonSnapshot, after: PoolmonSnapshot): readonly ProcessMemoryDelta[] => {
  const beforeByPid = new Map(before.processes.map((process) => [process.pid, process]))
  const afterByPid = new Map(after.processes.map((process) => [process.pid, process]))
  const pids = new Set([...beforeByPid.keys(), ...afterByPid.keys()])
  return [...pids]
    .map((pid) => {
      const beforeProcess = beforeByPid.get(pid)
      const afterProcess = afterByPid.get(pid)
      const beforeMemoryKb = beforeProcess?.memoryKb || 0
      const afterMemoryKb = afterProcess?.memoryKb || 0
      return {
        afterMemoryKb,
        beforeMemoryKb,
        deltaMemoryKb: afterMemoryKb - beforeMemoryKb,
        imageName: afterProcess?.imageName || beforeProcess?.imageName || 'unknown',
        pid,
      }
    })
    .filter((process) => process.deltaMemoryKb !== 0)
    .sort((a, b) => b.deltaMemoryKb - a.deltaMemoryKb)
}

const getRows = (before: PoolmonSnapshot, after: PoolmonSnapshot): readonly PoolmonRowDelta[] => {
  const beforeByTag = new Map(before.rows.map((row) => [getRowKey(row), row]))
  const afterByTag = new Map(after.rows.map((row) => [getRowKey(row), row]))
  const keys = new Set([...beforeByTag.keys(), ...afterByTag.keys()])
  return [...keys]
    .map((key) => {
      const beforeRow = beforeByTag.get(key)
      const afterRow = afterByTag.get(key)
      const current = afterRow || beforeRow!
      return {
        ...current,
        afterBytes: afterRow?.bytes || 0,
        beforeBytes: beforeRow?.bytes || 0,
        deltaAllocs: (afterRow?.allocs || 0) - (beforeRow?.allocs || 0),
        deltaBytes: (afterRow?.bytes || 0) - (beforeRow?.bytes || 0),
        deltaDiff: (afterRow?.diff || 0) - (beforeRow?.diff || 0),
        deltaFrees: (afterRow?.frees || 0) - (beforeRow?.frees || 0),
      }
    })
    .sort((a, b) => b.deltaBytes - a.deltaBytes || b.afterBytes - a.afterBytes)
}

const getTotalBytes = (snapshot: PoolmonSnapshot): number => snapshot.rows.reduce((total, row) => total + row.bytes, 0)

export const compareSnapshots = (before: PoolmonSnapshot, after: PoolmonSnapshot) => {
  const rows = getRows(before, after)
  const thresholdBytes = Number(process.env.POOLMON_LEAK_THRESHOLD_BYTES) || DefaultLeakThresholdBytes
  const growth = rows.filter((row) => row.deltaBytes >= thresholdBytes).slice(0, MaxRows)
  const processDeltas = getProcessDeltas(before, after)
  const totalBeforeBytes = getTotalBytes(before)
  const totalAfterBytes = getTotalBytes(after)
  return {
    isLeak: growth.length > 0,
    pool: {
      afterBytes: totalAfterBytes,
      beforeBytes: totalBeforeBytes,
      deltaBytes: totalAfterBytes - totalBeforeBytes,
    },
    processMemoryGrowth: processDeltas.filter((process) => process.deltaMemoryKb > 0).slice(0, MaxRows),
    processMemoryRows: processDeltas.slice(0, MaxRows),
    processSnapshotErrors: [before.processError, after.processError].filter(Boolean),
    rawSnapshots: {
      after: after.raw,
      before: before.raw,
    },
    rows: rows.slice(0, MaxRows),
    thresholdBytes,
    topGrowth: growth,
  }
}

const formatBytes = (bytes: number): string => {
  const sign = bytes < 0 ? '-' : ''
  let value = Math.abs(bytes)
  for (const unit of ['B', 'KiB', 'MiB', 'GiB']) {
    if (value < 1024 || unit === 'GiB') {
      return `${sign}${value.toFixed(value < 10 && unit !== 'B' ? 1 : 0)} ${unit}`
    }
    value /= 1024
  }
  return `${sign}${value} GiB`
}

export const id = MeasureId.Poolmon
export const targets: readonly Dynamic[] = []

export const create = () => {
  const poolmonPath = resolvePoolmonPath()
  return [{ poolmonPath, pooltagPath: resolvePooltagPath(poolmonPath) } satisfies State]
}

export const start = async (state: State): Promise<PoolmonSnapshot> => capture(state)
export const stop = async (state: State): Promise<PoolmonSnapshot> => capture(state)
export const releaseResources = () => undefined
export const compare = compareSnapshots
export const isLeak = (result: Dynamic): boolean => result?.isLeak === true
export const summary = (result: Dynamic): string => {
  const topGrowth = result.topGrowth || []
  const tags = topGrowth
    .slice(0, 5)
    .map((row: Dynamic) => `${row.tag.trim()} ${formatBytes(row.deltaBytes)}${row.mappedDriver ? ` (${row.mappedDriver})` : ''}`)
    .join(', ')
  const process = result.processMemoryGrowth?.[0]
  const processText = process ? `; top process growth ${process.imageName} (PID ${process.pid}) +${process.deltaMemoryKb} KiB` : ''
  return `PoolMon pool growth: ${formatBytes(result.pool.deltaBytes)}${tags ? `; top tags: ${tags}` : ''}${processText}`
}
