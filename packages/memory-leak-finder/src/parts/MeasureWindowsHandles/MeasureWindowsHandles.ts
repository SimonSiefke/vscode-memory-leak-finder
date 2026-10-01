import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { Dynamic } from '../Types/Types.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'

const execFileAsync = promisify(execFile)
const DefaultLeakThreshold = 0
const ProcessQueryTimeout = 5 * 60 * 1000

export interface WindowsHandleProcess {
  readonly name: string
  readonly pid: number
  readonly parentPid: number
  readonly handleCount: number
}

export interface WindowsHandlesSnapshot {
  readonly capturedAt: string
  readonly rootPid: number
  readonly processes: readonly WindowsHandleProcess[]
}

interface State {
  readonly rootPid: number
}

const normalizeJsonArray = (value: Dynamic): readonly Dynamic[] => {
  if (Array.isArray(value)) {
    return value
  }
  if (value && typeof value === 'object') {
    return [value]
  }
  return []
}

const parseProcess = (value: Dynamic): WindowsHandleProcess | undefined => {
  const pid = Number(value?.pid)
  const parentPid = Number(value?.parentPid)
  const handleCount = Number(value?.handleCount)
  if (
    !Number.isInteger(pid) ||
    pid < 0 ||
    !Number.isInteger(parentPid) ||
    parentPid < 0 ||
    !Number.isFinite(handleCount) ||
    handleCount < 0
  ) {
    return undefined
  }
  return {
    handleCount,
    name: typeof value?.name === 'string' ? value.name : 'unknown',
    parentPid,
    pid,
  }
}

export const parseProcessList = (value: Dynamic): readonly WindowsHandleProcess[] => {
  return normalizeJsonArray(value)
    .map(parseProcess)
    .filter((process): process is WindowsHandleProcess => Boolean(process))
}

export const filterProcessTree = (processes: readonly WindowsHandleProcess[], rootPid: number): readonly WindowsHandleProcess[] => {
  const childrenByParent = new Map<number, WindowsHandleProcess[]>()
  for (const process of processes) {
    const children = childrenByParent.get(process.parentPid) || []
    children.push(process)
    childrenByParent.set(process.parentPid, children)
  }
  const byPid = new Map(processes.map((process) => [process.pid, process]))
  const result: WindowsHandleProcess[] = []
  const seen = new Set<number>()
  const visit = (pid: number): void => {
    if (seen.has(pid)) {
      return
    }
    seen.add(pid)
    const process = byPid.get(pid)
    if (process) {
      result.push(process)
    }
    for (const child of childrenByParent.get(pid) || []) {
      visit(child.pid)
    }
  }
  visit(rootPid)
  return result
}

const getPowerShellCommand = (_rootPid: number): string => `
$ErrorActionPreference = 'Stop'
$processes = @(Get-CimInstance Win32_Process -Property ProcessId,ParentProcessId,Name,HandleCount)
$excludedPids = @($PID)
do {
  $newExcludedPids = @($processes |
    Where-Object { $excludedPids -contains [int]$_.ParentProcessId -and $excludedPids -notcontains [int]$_.ProcessId } |
    ForEach-Object { [int]$_.ProcessId })
  if ($newExcludedPids.Count -gt 0) {
    $excludedPids += $newExcludedPids
  }
} while ($newExcludedPids.Count -gt 0)
$processes |
  Where-Object { $excludedPids -notcontains [int]$_.ProcessId } |
  ForEach-Object {
    [pscustomobject]@{
      pid = [int]$_.ProcessId
      parentPid = if ($null -eq $_.ParentProcessId) { 0 } else { [int]$_.ParentProcessId }
      name = [string]$_.Name
      handleCount = if ($null -eq $_.HandleCount) { 0 } else { [int64]$_.HandleCount }
    }
  } |
  ConvertTo-Json -Compress
`

const capture = async (state: State): Promise<WindowsHandlesSnapshot> => {
  if (process.platform !== 'win32') {
    throw new Error('Windows handles measure is only supported on Windows')
  }
  let stdout: string
  try {
    const result = await execFileAsync(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', getPowerShellCommand(state.rootPid)],
      {
        encoding: 'utf8',
        maxBuffer: 8 * 1024 * 1024,
        timeout: ProcessQueryTimeout,
        killSignal: 'SIGKILL',
        windowsHide: true,
      },
    )
    stdout = result.stdout
  } catch (error) {
    throw new Error(`Windows process handle query failed: ${error instanceof Error ? error.message : String(error)}`)
  }
  let parsed: Dynamic
  try {
    parsed = JSON.parse(stdout)
  } catch (error) {
    throw new Error(`Windows process handle query returned invalid JSON: ${error instanceof Error ? error.message : String(error)}`)
  }
  const processes = filterProcessTree(parseProcessList(parsed), state.rootPid)
  if (!processes.some((process) => process.pid === state.rootPid)) {
    throw new Error(`Root process ${state.rootPid} was not found in the Windows process list`)
  }
  return {
    capturedAt: new Date().toISOString(),
    processes,
    rootPid: state.rootPid,
  }
}

interface WindowsHandleDelta {
  readonly name: string
  readonly pid: number
  readonly parentPid: number
  readonly beforeHandles: number
  readonly afterHandles: number
  readonly deltaHandles: number
}

const getProcessDeltas = (before: WindowsHandlesSnapshot, after: WindowsHandlesSnapshot): readonly WindowsHandleDelta[] => {
  const beforeByPid = new Map(before.processes.map((process) => [process.pid, process]))
  const afterByPid = new Map(after.processes.map((process) => [process.pid, process]))
  const pids = new Set([...beforeByPid.keys(), ...afterByPid.keys()])
  return [...pids]
    .map((pid) => {
      const beforeProcess = beforeByPid.get(pid)
      const afterProcess = afterByPid.get(pid)
      const beforeHandles = beforeProcess?.handleCount || 0
      const afterHandles = afterProcess?.handleCount || 0
      return {
        afterHandles,
        beforeHandles,
        deltaHandles: afterHandles - beforeHandles,
        name: afterProcess?.name || beforeProcess?.name || 'unknown',
        parentPid: afterProcess?.parentPid || beforeProcess?.parentPid || 0,
        pid,
      }
    })
    .filter((process) => process.deltaHandles !== 0)
    .sort((a, b) => b.deltaHandles - a.deltaHandles || b.afterHandles - a.afterHandles)
}

export const compareSnapshots = (before: WindowsHandlesSnapshot, after: WindowsHandlesSnapshot) => {
  const processDeltas = getProcessDeltas(before, after)
  const beforeHandles = before.processes.reduce((total, process) => total + process.handleCount, 0)
  const afterHandles = after.processes.reduce((total, process) => total + process.handleCount, 0)
  const deltaHandles = afterHandles - beforeHandles
  const configuredThreshold = Number(process.env.WINDOWS_HANDLES_LEAK_THRESHOLD)
  const threshold = Number.isFinite(configuredThreshold) && configuredThreshold >= 0 ? configuredThreshold : DefaultLeakThreshold
  return {
    afterHandles,
    beforeHandles,
    deltaHandles,
    isLeak: deltaHandles > threshold,
    processDeltas,
    rootPid: after.rootPid,
    threshold,
    topGrowth: processDeltas.filter((process) => process.deltaHandles > 0).slice(0, 100),
  }
}

export const id = MeasureId.WindowsHandles
export const targets: readonly Dynamic[] = []

export const create = ({ pid }: { pid: number }) => {
  if (process.platform !== 'win32') {
    throw new Error('Windows handles measure is only supported on Windows')
  }
  if (!Number.isInteger(pid) || pid <= 0) {
    throw new Error(`Invalid root process id: ${pid}`)
  }
  return [{ rootPid: pid } satisfies State]
}

export const start = async (state: State): Promise<WindowsHandlesSnapshot> => capture(state)
export const stop = async (state: State): Promise<WindowsHandlesSnapshot> => capture(state)
export const releaseResources = () => undefined
export const compare = compareSnapshots
export const isLeak = (result: Dynamic): boolean => result?.isLeak === true
export const summary = (result: Dynamic): string => {
  const details = (result.topGrowth || [])
    .slice(0, 5)
    .map((process: Dynamic) => `${process.name} (PID ${process.pid}) +${process.deltaHandles}`)
    .join(', ')
  return `Windows handle growth: ${result.deltaHandles}${details ? `; top processes: ${details}` : ''}`
}
