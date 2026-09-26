import { spawn, type ChildProcess } from 'node:child_process'
import { setTimeout } from 'node:timers/promises'
import type { Dynamic } from '../Types/Types.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'

export interface StackRow {
  readonly bytes: number
  readonly allocations: number
  readonly stack: readonly string[]
}
export interface Report {
  readonly capturedAt: string
  readonly rows: readonly StackRow[]
  readonly raw: string
}
const Header = /^\[\d\d:\d\d:\d\d\] Top \d+ stacks with outstanding allocations:\s*$/
export const parseReport = (raw: string): Report => {
  const lines = raw.trimEnd().split('\n')
  if (!Header.test(lines.shift() ?? '')) throw new Error('Invalid BCC memleak report header')
  const rows: { bytes: number; allocations: number; stack: string[] }[] = []
  for (const line of lines) {
    if (!line.trim()) continue
    const match = /^\s+(\d+) bytes in (\d+) allocations from stack\s*$/.exec(line)
    if (match) {
      rows.push({ bytes: Number(match[1]), allocations: Number(match[2]), stack: [] })
    } else if (/^\s+/.test(line) && rows.length) {
      rows.at(-1)!.stack.push(line.trim())
    } else throw new Error(`Unrecognized BCC memleak output: ${line}`)
  }
  if (rows.some((row) => !row.stack.length || !Number.isSafeInteger(row.bytes) || !Number.isSafeInteger(row.allocations)))
    throw new Error('Incomplete BCC allocation stack')
  return { capturedAt: new Date().toISOString(), rows, raw }
}

export interface State {
  readonly command: string
  readonly args: readonly string[]
  readonly scope: string
  child?: ChildProcess
  closed?: Promise<void>
  exited: boolean
  stopping: boolean
  error: string
  stderr: string
  pending: string
  reportText: string
  reportCount: number
  latest?: Report
  outputBytes: number
}
export const newState = (command: string, args: readonly string[], scope: string): State => ({
  command,
  args,
  scope,
  exited: false,
  stopping: false,
  error: '',
  stderr: '',
  pending: '',
  reportText: '',
  reportCount: 0,
  outputBytes: 0,
})

const consume = (state: State, chunk: string) => {
  state.outputBytes += Buffer.byteLength(chunk)
  if (state.outputBytes > 64 * 1024 * 1024) {
    state.error = 'BCC memleak output exceeded 64 MiB; shorten the scenario'
    state.child?.kill('SIGTERM')
    return
  }
  state.pending += chunk
  let end: number
  while ((end = state.pending.indexOf('\n')) !== -1) {
    const line = state.pending.slice(0, end).replace(/\r$/, '')
    state.pending = state.pending.slice(end + 1)
    if (Header.test(line)) {
      // A following header is the boundary proving the previous report is complete.
      if (state.reportText) {
        state.latest = parseReport(state.reportText)
        state.reportCount++
      }
      state.reportText = `${line}\n`
    } else if (state.reportText) state.reportText += `${line}\n`
  }
}

const waitForReport = async (state: State, minimum: number, timeoutMs = 30000): Promise<Report> => {
  const deadline = Date.now() + timeoutMs
  while (state.reportCount < minimum) {
    if (state.error || state.exited) throw new Error(`BCC memleak failed: ${state.error || 'unexpected exit'}\n${state.stderr}`)
    if (Date.now() >= deadline)
      throw new Error(`Timed out waiting for BCC memleak; check installation, BPF permissions, and kernel support\n${state.stderr}`)
    await setTimeout(25)
  }
  if (state.error || state.exited) throw new Error(`BCC memleak failed: ${state.error || 'unexpected exit'}\n${state.stderr}`)
  return state.latest!
}

export const releaseResources = async (state: State) => {
  if (!state.child || state.exited) return
  state.stopping = true
  state.child.kill('SIGTERM')
  const timer = globalThis.setTimeout(() => state.child?.kill('SIGKILL'), 2000)
  try {
    await state.closed
  } finally {
    globalThis.clearTimeout(timer)
  }
}
export const id = MeasureId.LinuxAllocationStacks
export const targets: readonly Dynamic[] = []
export const create = ({ pid }: { pid: number }) => {
  if (process.platform !== 'linux') throw new Error('linux-allocation-stacks requires Linux and BCC memleak')
  const target = process.env.BCC_MEMLEAK_PID
  const targetPid = target === 'root' ? pid : target === undefined ? undefined : Number(target)
  if (targetPid !== undefined && (!Number.isSafeInteger(targetPid) || targetPid <= 0))
    throw new Error('BCC_MEMLEAK_PID must be root or a positive PID')
  const args = ['-o', '500', '-T', '100']
  if (targetPid !== undefined) args.push('-p', String(targetPid))
  args.push('1')
  return [
    newState(
      process.env.BCC_MEMLEAK_PATH || 'memleak-bpfcc',
      args,
      targetPid === undefined ? 'system-wide kernel' : `userspace PID ${targetPid}`,
    ),
  ]
}
export const start = async (state: State) => {
  if (state.child) throw new Error('BCC memleak measurement already started')
  const child = spawn(state.command, [...state.args], { env: { ...process.env, PYTHONUNBUFFERED: '1' }, stdio: ['ignore', 'pipe', 'pipe'] })
  state.child = child
  state.closed = new Promise<void>((resolve) => {
    child.once('close', (code, signal) => {
      state.exited = true
      if (!state.stopping && !state.error) state.error = `exit ${code}, signal ${signal}`
      resolve()
    })
  })
  child.once('error', (error) => {
    state.error = error.message
  })
  child.stdout!.setEncoding('utf8').on('data', (chunk: string) => {
    try {
      consume(state, chunk)
    } catch (error) {
      state.error = error.message
      child.kill('SIGTERM')
    }
  })
  child.stderr!.setEncoding('utf8').on('data', (chunk: string) => {
    state.stderr = (state.stderr + chunk).slice(-65536)
  })
  try {
    return await waitForReport(state, 1)
  } catch (error) {
    await releaseResources(state)
    throw error
  }
}
export const stop = async (state: State) => {
  if (!state.child) throw new Error('BCC memleak measurement was not started')
  try {
    // Skip the in-progress report, then wait for a complete post-scenario report.
    return await waitForReport(state, state.reportCount + 2)
  } finally {
    await releaseResources(state)
  }
}
export const compare = (before: Report, after: Report, _context?: Dynamic, state?: State) => {
  const previous = new Map(before.rows.map((row) => [row.stack.join('\n'), row]))
  const rows = after.rows
    .map((row) => {
      const old = previous.get(row.stack.join('\n'))
      return { ...row, beforeBytes: old?.bytes ?? null, deltaBytes: old ? row.bytes - old.bytes : null }
    })
    .sort((a, b) => b.bytes - a.bytes)
  return {
    scope: state?.scope ?? 'see capture configuration',
    rows,
    snapshots: { before, after },
    stderr: state?.stderr ?? '',
    isLeak: false,
  }
}
// Top-N truncation, allocator coverage and retained-but-live allocations prevent a definitive leak verdict.
export const isLeak = () => false
export const summary = (result: ReturnType<typeof compare>) =>
  `BCC allocation stacks (${result.scope}): ${result.rows.length} reported outstanding stacks; diagnostic profile, not an automatic leak verdict`
