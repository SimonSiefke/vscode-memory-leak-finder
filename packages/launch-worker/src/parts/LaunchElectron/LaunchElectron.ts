import { mkdir, rm } from 'node:fs/promises'
import type { CallgrindConfig } from '../CallgrindConfig/CallgrindConfig.ts'
import * as AssertCallgrindAvailable from '../AssertCallgrindAvailable/AssertCallgrindAvailable.ts'
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
  callgrindConfig,
  cliPath,
  cwd,
  env,
  headlessMode,
  platform = process.platform,
}: {
  addDisposable: (fn: () => Promise<void> | void) => void
  args: string[]
  callgrindConfig?: CallgrindConfig
  cliPath: string
  cwd: string
  env: NodeJS.ProcessEnv
  headlessMode: boolean
  platform?: string
}) => {
  try {
    const allArgs = GetElectronArgs.getElectronArgs({ args, headlessMode })
    let spawnPath = cliPath
    let spawnArgs = allArgs
    if (callgrindConfig?.enabled) {
      await AssertCallgrindAvailable.assertCallgrindAvailable(platform)
      await rm(callgrindConfig.spoolDir, { force: true, recursive: true })
      await mkdir(callgrindConfig.spoolDir, { recursive: true })
      spawnPath = 'valgrind'
      spawnArgs = [
        '--tool=callgrind',
        '--trace-children=yes',
        '--instr-atstart=no',
        `--callgrind-out-file=${callgrindConfig.spoolDir}/callgrind.out.%p`,
        `--vgdb-prefix=${callgrindConfig.vgdbPrefix}`,
        `--log-file=${callgrindConfig.spoolDir}/valgrind.%p.log`,
        cliPath,
        ...allArgs,
      ]
    }
    const child = Spawn.spawn(spawnPath, spawnArgs, {
      cwd,
      env,
    })
    if (child.pid === undefined) {
      throw new Error(`Failed to get PID from spawned process`)
    }
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
