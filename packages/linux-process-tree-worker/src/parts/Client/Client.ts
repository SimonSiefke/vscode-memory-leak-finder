import { spawn } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout } from 'node:timers/promises'
import { parseProcessStat } from '../LinuxProcessTreeResources/LinuxProcessTreeResources.ts'
import { formatSummary, type Result } from '../LinuxProcessTreeResources/LinuxProcessTreeResourceResult.ts'

export interface MeasurementHandle {
  readonly outputDirectory: string
  readonly resultPath: string
  readonly workerPid: number
  readonly workerStartTimeTicks: string
}

interface WorkerResponse {
  readonly error?: string
  readonly ready?: boolean
  readonly result?: Result
}

const hasErrorCode = (error: unknown, code: string): boolean => {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === code
}

const PollIntervalMs = 25
const StartTimeoutMs = 10_000
const StopTimeoutMs = 5000

const readResponse = async (path: string): Promise<WorkerResponse | undefined> => {
  try {
    return JSON.parse(await readFile(path, 'utf8'))
  } catch (error) {
    if (error instanceof SyntaxError || hasErrorCode(error, 'ENOENT')) {
      return undefined
    }
    throw error
  }
}

const getStartTimeTicks = async (pid: number): Promise<string | undefined> => {
  try {
    return parseProcessStat(await readFile(`/proc/${pid}/stat`, 'utf8')).startTimeTicks
  } catch (error) {
    if (hasErrorCode(error, 'ENOENT') || hasErrorCode(error, 'ESRCH')) {
      return undefined
    }
    throw error
  }
}

const isWorkerAlive = async (handle: MeasurementHandle): Promise<boolean> => {
  return (await getStartTimeTicks(handle.workerPid)) === handle.workerStartTimeTicks
}

const waitForResponse = async (
  path: string,
  handle: MeasurementHandle,
  timeoutMs: number,
  description: string,
): Promise<WorkerResponse> => {
  const startTime = Date.now()
  while (true) {
    const response = await readResponse(path)
    if (response) {
      return response
    }
    if (!(await isWorkerAlive(handle))) {
      throw new Error(`Linux process-tree worker exited before ${description}`)
    }
    if (Date.now() - startTime > timeoutMs) {
      throw new Error(`Timed out waiting for Linux process-tree worker ${description}`)
    }
    await setTimeout(PollIntervalMs)
  }
}

const waitForExit = async (handle: MeasurementHandle): Promise<void> => {
  const startTime = Date.now()
  while (await isWorkerAlive(handle)) {
    if (Date.now() - startTime > StopTimeoutMs) {
      throw new Error(`Timed out waiting for Linux process-tree worker ${handle.workerPid} to exit`)
    }
    await setTimeout(PollIntervalMs)
  }
}

const signal = async (handle: MeasurementHandle, signal: NodeJS.Signals): Promise<void> => {
  if (await isWorkerAlive(handle)) {
    process.kill(handle.workerPid, signal)
  }
}

export const dispose = async (handle: MeasurementHandle): Promise<void> => {
  try {
    await signal(handle, 'SIGKILL')
    await waitForExit(handle)
  } finally {
    await rm(handle.outputDirectory, { force: true, recursive: true })
  }
}

export const start = async (
  pid: number,
  { perfOutputPath, window }: { readonly perfOutputPath?: string; readonly window: 'fromStart' | 'scenario' },
): Promise<MeasurementHandle> => {
  if (process.platform !== 'linux') {
    throw new Error('Linux process-tree resource measurement is only supported on Linux')
  }
  const outputDirectory = await mkdtemp(join(tmpdir(), 'vmlf-linux-process-tree-'))
  const configPath = join(outputDirectory, 'config.json')
  const readyPath = join(outputDirectory, 'ready.json')
  const resultPath = join(outputDirectory, 'result.json')
  await writeFile(
    configPath,
    JSON.stringify({
      ...(perfOutputPath ? { perfOutputPath } : {}),
      pid,
      readyPath,
      resultPath,
      window,
    }),
  )
  const workerPath = fileURLToPath(new URL('../../main.ts', import.meta.url))
  const child = spawn(process.execPath, [workerPath, configPath], {
    stdio: 'ignore',
  })
  try {
    await new Promise<void>((resolve, reject) => {
      child.once('error', reject)
      child.once('spawn', resolve)
    })
    if (child.pid === undefined) {
      throw new Error('Failed to get PID from Linux process-tree worker')
    }
    const workerStartTimeTicks = await getStartTimeTicks(child.pid)
    if (!workerStartTimeTicks) {
      throw new Error('Linux process-tree worker exited during startup')
    }
    const handle: MeasurementHandle = {
      outputDirectory,
      resultPath,
      workerPid: child.pid,
      workerStartTimeTicks,
    }
    child.unref()
    const response = await waitForResponse(readyPath, handle, StartTimeoutMs, 'startup')
    if (response.error) {
      throw new Error(response.error)
    }
    if (!response.ready) {
      throw new Error('Linux process-tree worker returned an invalid startup response')
    }
    return handle
  } catch (error) {
    if (child.pid !== undefined) {
      const workerStartTimeTicks = await getStartTimeTicks(child.pid)
      if (workerStartTimeTicks) {
        await dispose({ outputDirectory, resultPath, workerPid: child.pid, workerStartTimeTicks })
      } else {
        await rm(outputDirectory, { force: true, recursive: true })
      }
    } else {
      await rm(outputDirectory, { force: true, recursive: true })
    }
    throw error
  }
}

export const stop = async (handle: MeasurementHandle): Promise<Result> => {
  try {
    await signal(handle, 'SIGTERM')
    const response = await waitForResponse(handle.resultPath, handle, StopTimeoutMs, 'result')
    await waitForExit(handle)
    if (response.error) {
      throw new Error(response.error)
    }
    if (!response.result) {
      throw new Error('Linux process-tree worker returned an invalid result')
    }
    return response.result
  } finally {
    if (await isWorkerAlive(handle)) {
      await signal(handle, 'SIGKILL')
      await waitForExit(handle).catch(() => undefined)
    }
    await rm(handle.outputDirectory, { force: true, recursive: true })
  }
}

export type { Result }
export { formatSummary }
