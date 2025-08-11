import * as FileSystemWorker from '../FileSystemWorker/FileSystemWorker.ts'

/**
 * Executes a command with arguments and returns stdout and stderr
 * @param {string} command - The command to execute
 * @param {string[]} args - Array of arguments to pass to the command
 * @param {{cwd?:string}} options - Additional options for execa
 * @returns {Promise<{stdout: string, stderr: string, exitCode: number}>} The stdout, stderr, and exit code from the command
 */
export const exec = async (command, args, options = {}) => {
  const result = await FileSystemWorker.exec(command, args, options)
  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    exitCode: result.exitCode || 0,
  }
}
