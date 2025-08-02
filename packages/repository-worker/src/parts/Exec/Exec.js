import { execa } from 'execa'

/**
 * Executes a command with arguments and returns stdout and stderr
 * @param {string} command - The command to execute
 * @param {string[]} args - Array of arguments to pass to the command
 * @param {Object} options - Additional options for execa
 * @returns {Promise<{stdout: string, stderr: string}>} The stdout and stderr from the command
 */
export const exec = async (command, args, options = {}) => {
  const result = await execa(command, args, options)
  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    exitCode: result.exitCode,
  }
}
