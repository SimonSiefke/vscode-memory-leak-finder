import { spawn, type ChildProcess } from 'node:child_process'
import { PerfEvents } from '../LinuxProcessTreeResources/LinuxProcessTreeResources.ts'

const perfInstallCommand = 'sudo apt install -y linux-tools-common linux-tools-generic linux-tools-$(uname -r)'

export interface PerfStatResult {
  readonly code: number | null
  readonly signal: NodeJS.Signals | null
  readonly stderr: string
}

export interface PerfStatSession {
  readonly args: readonly string[]
  readonly process: ChildProcess
  readonly resultPromise: Promise<PerfStatResult>
}

export const getPerfStatArgs = (pids: readonly number[]): readonly string[] => {
  return ['stat', '--no-big-num', '-x', ',', '-e', PerfEvents.join(','), '-p', pids.join(',')]
}

const toPerfSpawnError = (error: unknown): unknown => {
  if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
    return new Error(`The perf program is not available. Install it with: ${perfInstallCommand}`)
  }
  return error
}

export const start = async (pids: readonly number[]): Promise<PerfStatSession> => {
  if (pids.length === 0) {
    throw new Error('Cannot start perf stat without process IDs')
  }
  const args = getPerfStatArgs(pids)
  const perfProcess = spawn('perf', args, {
    stdio: ['ignore', 'ignore', 'pipe'],
  })
  let stderr = ''
  perfProcess.stderr?.setEncoding('utf8')
  perfProcess.stderr?.on('data', (chunk) => {
    stderr += chunk
  })
  const resultPromise = new Promise<PerfStatResult>((resolve, reject) => {
    perfProcess.once('error', (error) => {
      reject(toPerfSpawnError(error))
    })
    perfProcess.once('close', (code, signal) => {
      resolve({ code, signal, stderr })
    })
  })
  const spawnPromise = new Promise<void>((resolve, reject) => {
    perfProcess.once('error', (error) => {
      reject(toPerfSpawnError(error))
    })
    perfProcess.once('spawn', resolve)
  })
  try {
    await spawnPromise
  } catch (error) {
    await resultPromise.catch(() => undefined)
    throw error
  }
  return {
    args,
    process: perfProcess,
    resultPromise,
  }
}

export const stop = async (session: PerfStatSession): Promise<PerfStatResult> => {
  if (session.process.exitCode === null && !session.process.killed) {
    session.process.kill('SIGINT')
  }
  return session.resultPromise
}
