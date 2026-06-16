import * as GetElectronArgs from '../GetElectronArgs/GetElectronArgs.ts'
import * as Spawn from '../Spawn/Spawn.ts'
import { VError } from '../VError/VError.ts'

// const logFile = '/tmp/lvce-manual-tests-log.txt'
// const logStream = createWriteStream(logFile)

const handleStdout = (data: string) => {
  console.error(`[launch-worker-debug] stdout ${data}`)
}

const handleStdErr = (data: string) => {
  console.error(`[launch-worker-debug] stderr ${data}`)
}

export const launchElectron = async ({
  addDisposable,
  args,
  cliPath,
  cwd,
  env,
  headlessMode,
}: {
  addDisposable: (fn: () => Promise<void> | void) => void
  args: string[]
  cliPath: string
  cwd: string
  env: NodeJS.ProcessEnv
  headlessMode: boolean
}) => {
  try {
    const allArgs = GetElectronArgs.getElectronArgs({ args, headlessMode })
    console.error(`[launch-worker-debug] spawning ${cliPath} ${allArgs.join(' ')}`)
    const child = Spawn.spawn(cliPath, allArgs, {
      cwd,
      env,
    })
    if (child.pid === undefined) {
      throw new Error(`Failed to get PID from spawned process`)
    }
    console.error(`[launch-worker-debug] spawned pid=${child.pid}`)
    child.on('error', (error) => {
      console.error(`[launch-worker-debug] process error ${error.message}`)
    })
    child.on('exit', (code, signal) => {
      console.error(`[launch-worker-debug] process exit code=${code} signal=${signal}`)
    })
    child.on('close', (code, signal) => {
      console.error(`[launch-worker-debug] process close code=${code} signal=${signal}`)
    })
    addDisposable(() => {
      child.kill('SIGKILL')
    })
    if (child.stdout) {
      child.stdout.setEncoding('utf-8')
      child.stdout.on('data', handleStdout)
    }
    if (child.stderr) {
      child.stderr.setEncoding('utf-8')
      child.stderr.on('data', handleStdErr)
    }
    return {
      child,
      pid: child.pid,
    }
  } catch (error) {
    throw new VError(error, `Failed to launch electron`)
  }
}
