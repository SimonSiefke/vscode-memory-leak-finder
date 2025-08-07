import * as GetElectronArgs from '../GetElectronArgs/GetElectronArgs.js'
import * as Spawn from '../Spawn/Spawn.js'
import { VError } from '../VError/VError.js'
import * as WaitForDebuggerListening from '../WaitForDebuggerListening/WaitForDebuggerListening.js'

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

export const launchElectron = async ({ cliPath, args, headlessMode, cwd, env, addDisposable }) => {
  try {
    const allArgs = GetElectronArgs.getElectronArgs({ headlessMode, args })
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
    const webSocketUrl = await WaitForDebuggerListening.waitForDebuggerListening(child.stderr)
    return {
      child,
      webSocketUrl,
    }
  } catch (error) {
    throw new VError(error, `Failed to launch electron`)
  }
}
