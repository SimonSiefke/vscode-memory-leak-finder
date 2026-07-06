import { spawn, type ChildProcess } from 'node:child_process'

const perfInstallCommand = 'sudo apt install linux-tools-common linux-tools-generic linux-tools-$(uname -r)'

export interface PerfStatResult {
  readonly code: number | null
  readonly signal: NodeJS.Signals | null
  readonly stderr: string
}

export interface PerfStatSession {
  readonly args: readonly string[]
  readonly pid: number
  readonly process: ChildProcess
  readonly resultPromise: Promise<PerfStatResult>
}

export const getPerfStatArgs = (pid: number): readonly string[] => {
  return ['stat', '--no-big-num', '-x', ',', '-e', 'instructions:u,cycles:u', '-p', `${pid}`]
}

const isNodeError = (error: unknown): error is NodeJS.ErrnoException => {
  return error instanceof Error && 'code' in error
}

const toPerfSpawnError = (error: unknown): unknown => {
  if (isNodeError(error) && error.code === 'ENOENT') {
    return new Error(`The perf program is not available. Install it with: ${perfInstallCommand}`)
  }
  return error
}

export const startPerfStat = async (pid: number): Promise<PerfStatSession> => {
  const args = getPerfStatArgs(pid)
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
      resolve({
        code,
        signal,
        stderr,
      })
    })
  })
  const spawnPromise = new Promise<void>((resolve, reject) => {
    perfProcess.once('error', (error) => {
      reject(toPerfSpawnError(error))
    })
    perfProcess.once('spawn', () => {
      resolve()
    })
  })
  try {
    await spawnPromise
  } catch (error) {
    await resultPromise.catch(() => undefined)
    throw error
  }
  return {
    args,
    pid,
    process: perfProcess,
    resultPromise,
  }
}

export const stopPerfStat = async (session: PerfStatSession): Promise<PerfStatResult> => {
  if (session.process.exitCode === null && !session.process.killed) {
    session.process.kill('SIGINT')
  }
  return session.resultPromise
}
