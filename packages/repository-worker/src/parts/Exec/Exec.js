import { execa } from 'execa'

/**
 * Executes a command with arguments
 * @param {string} command - The command to execute
 * @param {string[]} args - Array of arguments to pass to the command
 * @param {Object} options - Additional options for execa
 * @returns {Promise<Object>} The result from execa
 */
export const exec = async (command, args, options = {}) => {
  return execa(command, args, options)
}

/**
 * Executes a command with arguments and returns the stdout
 * @param {string} command - The command to execute
 * @param {string[]} args - Array of arguments to pass to the command
 * @param {Object} options - Additional options for execa
 * @returns {Promise<string>} The stdout from the command
 */
export const execStdout = async (command, args, options = {}) => {
  const result = await execa(command, args, options)
  return result.stdout
}

/**
 * Executes a command with arguments and returns the stderr
 * @param {string} command - The command to execute
 * @param {string[]} args - Array of arguments to pass to the command
 * @param {Object} options - Additional options for execa
 * @returns {Promise<string>} The stderr from the command
 */
export const execStderr = async (command, args, options = {}) => {
  const result = await execa(command, args, options)
  return result.stderr
} 