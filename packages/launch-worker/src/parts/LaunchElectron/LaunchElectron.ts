import * as LinuxProcessTreeWorker from '@vscode-memory-leak-finder/linux-process-tree-worker'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { CallgrindConfig } from '../CallgrindConfig/CallgrindConfig.ts'
import type { CpuPerformanceCountersFromStartConfig } from '../CpuPerformanceCountersFromStart/CpuPerformanceCountersFromStart.ts'
import type { LinuxProcessTreeResourcesFromStartConfig } from '../LinuxProcessTreeResourcesFromStart/LinuxProcessTreeResourcesFromStart.ts'
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
  linuxProcessTreeResourcesFromStartConfig = {
    enabled: false,
    metadataPath: '',
    perfOutputPath: '',
  },
  platform = process.platform,
  cpuPerformanceCountersFromStartConfig = {
    enabled: false,
    metadataPath: '',
    outputPath: '',
  },
}: {
  addDisposable: (fn: () => Promise<void> | void) => void
  args: string[]
  callgrindConfig?: CallgrindConfig
  cliPath: string
  cpuPerformanceCountersFromStartConfig?: CpuPerformanceCountersFromStartConfig
  cwd: string
  env: NodeJS.ProcessEnv
  headlessMode: boolean
  linuxProcessTreeResourcesFromStartConfig?: LinuxProcessTreeResourcesFromStartConfig
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
    if (cpuPerformanceCountersFromStartConfig.enabled) {
      if (platform !== 'linux') {
        throw new Error('cpu-performance-counters-from-start is only supported on linux')
      }
      await mkdir(dirname(cpuPerformanceCountersFromStartConfig.outputPath), { recursive: true })
      await rm(cpuPerformanceCountersFromStartConfig.outputPath, { force: true })
      await rm(cpuPerformanceCountersFromStartConfig.metadataPath, { force: true })
      const measuredPath = spawnPath
      const measuredArgs = spawnArgs
      spawnPath = 'perf'
      spawnArgs = [
        'stat',
        '--no-big-num',
        '-x',
        ',',
        '-I',
        '100',
        '-e',
        'instructions:u,cycles:u',
        '-o',
        cpuPerformanceCountersFromStartConfig.outputPath,
        '--',
        measuredPath,
        ...measuredArgs,
      ]
    }
    if (linuxProcessTreeResourcesFromStartConfig.enabled) {
      if (platform !== 'linux') {
        throw new Error('linux-process-tree-resources-from-start is only supported on Linux')
      }
      await mkdir(dirname(linuxProcessTreeResourcesFromStartConfig.perfOutputPath), { recursive: true })
      await rm(linuxProcessTreeResourcesFromStartConfig.perfOutputPath, { force: true })
      await rm(linuxProcessTreeResourcesFromStartConfig.metadataPath, { force: true })
      const measuredPath = spawnPath
      const measuredArgs = spawnArgs
      spawnPath = 'perf'
      spawnArgs = [
        'stat',
        '--no-big-num',
        '-x',
        ',',
        '-I',
        '100',
        '-e',
        'duration_time,user_time,system_time,task-clock,instructions:u,cycles:u,context-switches,cpu-migrations,page-faults,minor-faults,major-faults',
        '-o',
        linuxProcessTreeResourcesFromStartConfig.perfOutputPath,
        '--',
        measuredPath,
        ...measuredArgs,
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
    if (cpuPerformanceCountersFromStartConfig.enabled) {
      await writeFile(
        cpuPerformanceCountersFromStartConfig.metadataPath,
        JSON.stringify({
          command: [spawnPath, ...spawnArgs],
          outputPath: cpuPerformanceCountersFromStartConfig.outputPath,
          perfPid: child.pid,
        }),
      )
    }
    if (linuxProcessTreeResourcesFromStartConfig.enabled) {
      const measurement = await LinuxProcessTreeWorker.start(child.pid, {
        perfOutputPath: linuxProcessTreeResourcesFromStartConfig.perfOutputPath,
        window: 'fromStart',
      })
      addDisposable(() => {
        return LinuxProcessTreeWorker.dispose(measurement)
      })
      await writeFile(
        linuxProcessTreeResourcesFromStartConfig.metadataPath,
        JSON.stringify({
          command: [spawnPath, ...spawnArgs],
          measurement,
          perfPid: child.pid,
        }),
      )
    }
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
