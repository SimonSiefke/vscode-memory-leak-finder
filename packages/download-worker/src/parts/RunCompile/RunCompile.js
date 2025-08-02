import { platform } from 'node:os'
import { execa } from 'execa'

/**
 * Runs the compilation process using npm run compile
 * @param {string} cwd - The working directory to run npm run compile in
 * @param {boolean} useNice - Whether to use nice command for resource management
 */
export const runCompile = async (cwd, useNice) => {
  if (useNice && platform() === 'linux') {
    console.log(`Using nice to reduce system resource usage...`)
    await execa('nice', ['-n', '10', 'npm', 'run', 'compile'], { cwd })
  } else {
    await execa('npm', ['run', 'compile'], { cwd })
  }
}