import * as NodeChildProcess from 'node:child_process'
import VError from 'verror'

/**
 *
 * @param {string} cliPath
 * @param {string[]} args
 * @param {NodeChildProcess.SpawnOptionsWithoutStdio} options
 * @returns
 */
export const spawn = (cliPath, args, options = {}) => {
  const childProcess = NodeChildProcess.spawn(cliPath, args, options)
  const handleError = (error) => {
    throw new VError(error, `Failed to spawn ${cliPath}`)
  }
  childProcess.on('error', handleError)
  return childProcess
}
