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
  readonly parentPid?: number
  readonly createdAt?: string | null
  readonly commandLine?: string | null
  readonly executablePath?: string | null
  readonly privateMemoryKb?: number | null
}

export interface PoolmonSnapshot {
  readonly capturedAt: string
  readonly rootPid?: number | null
  readonly poolmonPath: string
  readonly pooltagPath: string
  readonly raw: string
  readonly rows: readonly PoolmonRow[]
  readonly processes: readonly ProcessMemoryRow[]
  readonly processError: string
  readonly idleSnapshots?: readonly IdleSnapshot[]
}

interface IdleSnapshot {
  readonly idleSeconds: number
  readonly elapsedMs: number
  readonly snapshot: PoolmonSnapshot
}

interface State {
  readonly rootPid?: number | null
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

// Collect identity and memory together to avoid joining two queries across PID reuse.
export const processQuery = `
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$processes = @(Get-CimInstance Win32_Process -Property ProcessId,ParentProcessId,Name,CreationDate,CommandLine,ExecutablePath,WorkingSetSize,PrivatePageCount |
  Where-Object { $_.ProcessId -ne $PID -and $_.Name -ne 'poolmon.exe' } |
  ForEach-Object {
    [pscustomobject]@{
      pid = [int]$_.ProcessId
      parentPid = [int]$_.ParentProcessId
      imageName = [string]$_.Name
      createdAt = if ($null -eq $_.CreationDate) { $null } else { $_.CreationDate.ToUniversalTime().ToString('o') }
      commandLine = $_.CommandLine
      executablePath = $_.ExecutablePath
      memoryKb = if ($null -eq $_.WorkingSetSize) { $null } else { [double]$_.WorkingSetSize / 1024 }
      privateMemoryKb = if ($null -eq $_.PrivatePageCount) { $null } else { [double]$_.PrivatePageCount / 1024 }
    }
  })
ConvertTo-Json -InputObject $processes -Compress
`

export const parseProcessList = (raw: string): readonly ProcessMemoryRow[] => {
  const value = JSON.parse(raw.replace(/^\uFEFF/, ''))
  const rows = Array.isArray(value) ? value : [value]
  return rows.map((row) => {
    if (
      !row ||
      !Number.isInteger(row.pid) ||
      row.pid < 0 ||
      !Number.isInteger(row.parentPid) ||
      row.parentPid < 0 ||
      typeof row.imageName !== 'string' ||
      typeof row.memoryKb !== 'number' ||
      !Number.isFinite(row.memoryKb) ||
      row.memoryKb < 0 ||
      (row.privateMemoryKb !== null &&
        (typeof row.privateMemoryKb !== 'number' || !Number.isFinite(row.privateMemoryKb) || row.privateMemoryKb < 0))
    ) {
      throw new Error('Invalid process identity or memory in Win32_Process result')
    }
    for (const field of ['createdAt', 'commandLine', 'executablePath']) {
      if (row[field] !== null && typeof row[field] !== 'string') {
        throw new Error(`Invalid process ${field} in Win32_Process result`)
      }
    }
    return row as ProcessMemoryRow
  })
}

const captureProcesses = async (): Promise<{ readonly processes: readonly ProcessMemoryRow[]; readonly error: string }> => {
  try {
    const { stdout } = await execFileAsync('powershell.exe', ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', processQuery], {
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
      timeout: 60_000,
      windowsHide: true,
    })
    return { error: '', processes: parseProcessList(stdout) }
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
  const raw = await capturePoolmon(state)
  const processSnapshot = await captureProcesses()
  return {
    capturedAt: new Date().toISOString(),
    rootPid: state.rootPid ?? null,
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

interface ProcessMemoryDelta extends Omit<ProcessMemoryRow, 'memoryKb'> {
  readonly imageName: string
  readonly pid: number
  readonly beforeMemoryKb: number
  readonly afterMemoryKb: number
  readonly deltaMemoryKb: number
  readonly beforePrivateMemoryKb: number | null
  readonly afterPrivateMemoryKb: number | null
  readonly deltaPrivateMemoryKb: number | null
  readonly status: 'started' | 'exited' | 'running'
}

const getRowKey = (row: PoolmonRow): string => `${row.type}:${row.tag}`

const getProcessKey = (process: ProcessMemoryRow): string =>
  JSON.stringify([process.pid, process.createdAt ?? null, process.imageName.toLowerCase()])

const getProcessDeltas = (before: PoolmonSnapshot, after: PoolmonSnapshot): readonly ProcessMemoryDelta[] => {
  // A failed query must not make all processes appear to start or exit.
  if (before.processError || after.processError) {
    return []
  }
  const beforeByKey = new Map(before.processes.map((process) => [getProcessKey(process), process]))
  const afterByKey = new Map(after.processes.map((process) => [getProcessKey(process), process]))
  const keys = new Set([...beforeByKey.keys(), ...afterByKey.keys()])
  return [...keys]
    .map((key): ProcessMemoryDelta => {
      const beforeProcess = beforeByKey.get(key)
      const afterProcess = afterByKey.get(key)
      const { memoryKb: _memoryKb, ...identity } = (afterProcess || beforeProcess)!
      const beforeMemoryKb = beforeProcess?.memoryKb ?? 0
      const afterMemoryKb = afterProcess?.memoryKb ?? 0
      const beforePrivateMemoryKb = beforeProcess ? (beforeProcess.privateMemoryKb ?? null) : 0
      const afterPrivateMemoryKb = afterProcess ? (afterProcess.privateMemoryKb ?? null) : 0
      return {
        ...identity,
        afterMemoryKb,
        beforeMemoryKb,
        deltaMemoryKb: afterMemoryKb - beforeMemoryKb,
        beforePrivateMemoryKb,
        afterPrivateMemoryKb,
        deltaPrivateMemoryKb:
          beforePrivateMemoryKb === null || afterPrivateMemoryKb === null ? null : afterPrivateMemoryKb - beforePrivateMemoryKb,
        status: !beforeProcess ? 'started' : !afterProcess ? 'exited' : 'running',
      }
    })
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

const compareSnapshotPair = (before: PoolmonSnapshot, after: PoolmonSnapshot) => {
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
    processMemoryGrowth: processDeltas.filter((process) => process.deltaMemoryKb > 0),
    processMemoryRows: processDeltas,
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

export const compareSnapshots = (before: PoolmonSnapshot, after: PoolmonSnapshot) => {
  const { idleSnapshots = [], ...immediate } = after
  return {
    ...compareSnapshotPair(before, immediate),
    snapshots: { before, after: immediate },
    idleSnapshots: idleSnapshots.map(({ snapshot, ...timing }) => ({
      ...timing,
      snapshot,
      comparison: compareSnapshotPair(before, snapshot),
    })),
  }
}

export const parseIdleSeconds = (value = process.env.POOLMON_IDLE_SECONDS): readonly number[] => {
  if (value === undefined) {
    return [5, 30, 60]
  }
  if (value.trim() === '0') {
    return []
  }
  const seconds = value.split(',').map((part) => Number(part.trim()))
  if (
    seconds.some((second, index) => !Number.isFinite(second) || second <= 0 || second > 60 || (index > 0 && second <= seconds[index - 1]))
  ) {
    throw new Error('POOLMON_IDLE_SECONDS must be 0 or increasing comma-separated seconds in (0, 60]')
  }
  return seconds
}

export const captureAfterSnapshots = async (
  captureSnapshot: () => Promise<PoolmonSnapshot>,
  idleSeconds: readonly number[],
): Promise<PoolmonSnapshot> => {
  const immediate = await captureSnapshot()
  const startedAt = performance.now()
  const idleSnapshots: IdleSnapshot[] = []
  for (const seconds of idleSeconds) {
    // Offsets are relative to the immediate snapshot, not cumulative waits.
    await new Promise<void>((resolve) => setTimeout(resolve, Math.max(0, seconds * 1000 - (performance.now() - startedAt))))
    const snapshot = await captureSnapshot()
    idleSnapshots.push({ idleSeconds: seconds, elapsedMs: performance.now() - startedAt, snapshot })
  }
  return { ...immediate, idleSnapshots }
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

export const create = ({ pid }: { readonly pid?: number } = {}) => {
  parseIdleSeconds()
  const poolmonPath = resolvePoolmonPath()
  return [{ poolmonPath, pooltagPath: resolvePooltagPath(poolmonPath), rootPid: pid ?? null } satisfies State]
}

export const start = async (state: State): Promise<PoolmonSnapshot> => capture(state)
export const stop = async (state: State): Promise<PoolmonSnapshot> => captureAfterSnapshots(() => capture(state), parseIdleSeconds())
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
