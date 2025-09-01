import { exec } from '../Exec/Exec.ts'
import * as FileSystemWorker from '../FileSystemWorker/FileSystemWorker.ts'
import { fixTypescriptErrors } from '../FixTypescriptErrors/FixTypescriptErrors.ts'

/**
 * Runs the compilation process using npm run compile
 * @param {string} cwd - The working directory to run npm run compile in
 * @param {boolean} useNice - Whether to use nice command for resource management
 */
export const runCompile = async (cwd, useNice, mainJsPath) => {
  await fixTypescriptErrors(cwd)
  if (useNice) {
    await exec('nice', ['-n', '10', 'npm', 'run', 'compile'], { cwd })
  } else {
    await exec('npm', ['run', 'compile'], { cwd })
  }

  // Verify build was successful
  if (!(await FileSystemWorker.pathExists(mainJsPath))) {
    throw new Error('Build failed: out/main.js not found after compilation')
  }
}
