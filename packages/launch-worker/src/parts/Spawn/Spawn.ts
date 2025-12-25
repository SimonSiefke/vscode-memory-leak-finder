import * as NodeChildProcess from 'node:child_process'
import { VError } from '../VError/VError.ts'

export const spawn = (cliPath: string, args: string[], options: NodeChildProcess.SpawnOptionsWithoutStdio = {}) => {
  const childProcess = NodeChildProcess.spawn(cliPath, args, options)
  const handleError = (error: Error) => {
    throw new VError(error, `Failed to spawn ${cliPath}`)
  }
  childProcess.on('error', handleError)
  return childProcess
}
