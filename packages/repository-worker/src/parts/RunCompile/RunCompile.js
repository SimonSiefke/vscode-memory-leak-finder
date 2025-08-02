import { exec } from '../Exec/Exec.js'

/**
 * Runs the compilation process using npm run compile
 * @param {string} cwd - The working directory to run npm run compile in
 * @param {boolean} useNice - Whether to use nice command for resource management
 */
export const runCompile = async (cwd, useNice) => {
  if (useNice) {
    console.log(`Using nice to reduce system resource usage...`)
    await exec('nice', ['-n', '10', 'npm', 'run', 'compile'], { cwd })
  } else {
    await exec('npm', ['run', 'compile'], { cwd })
  }
}
