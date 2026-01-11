import * as GetElectronArgs from '../GetElectronArgs/GetElectronArgs.ts'
import * as Spawn from '../Spawn/Spawn.ts'
import { VError } from '../VError/VError.ts'

// const logFile = '/tmp/lvce-manual-tests-log.txt'
// const logStream = createWriteStream(logFile)

const handleStdout = (data: string) => {
  // logStream.write(data)
}

const handleStdErr = (data: string) => {
  // logStream.write(data)
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
    const child = Spawn.spawn(cliPath, allArgs, {
      cwd,
      env,
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
