import exitHook from 'exit-hook'
import { ChildProcess } from 'node:child_process'
import VError from 'verror'
import * as GetElectronArgs from '../GetElectronArgs/GetElectronArgs.js'
import * as Spawn from '../Spawn/Spawn.js'
import * as WaitForDebuggerListening from '../WaitForDebuggerListening/WaitForDebuggerListening.js'

export const state = {
  /**
   * @type {ChildProcess[]}
   */
  processes: [],
}

// const logFile = '/tmp/lvce-manual-tests-log.txt'
// const logStream = createWriteStream(logFile)

/**
 * @param {string} data
 */
const handleStdout = (data) => {
  // logStream.write(data)
}

/**
 * @param {string} data
 */
const handleStdErr = (data) => {
  // logStream.write(data)
}

export const launchElectron = async ({ cliPath, args, headlessMode, cwd }) => {
  try {
    const allArgs = GetElectronArgs.getElectronArgs({ headlessMode, args })
    const child = Spawn.spawn(cliPath, allArgs, {
      cwd,
    })
    child.stdout?.setEncoding('utf-8')
    child.stderr?.setEncoding('utf-8')
    child.stdout.on('data', handleStdout)
    child.stderr.on('data', handleStdErr)
    const webSocketUrl = await WaitForDebuggerListening.waitForDebuggerListening(child.stderr)
    const handleExit = () => {
      child.kill()
    }
    exitHook(handleExit)
    state.processes.push(child)
    return {
      child,
      webSocketUrl,
    }
  } catch (error) {
    throw new VError(error, `Failed to launch electron`)
  }
}

export const cleanup = () => {
  for (const childProcess of state.processes) {
    childProcess.kill('SIGKILL')
  }
  state.processes = []
}
