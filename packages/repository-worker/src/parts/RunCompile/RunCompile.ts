import { exec } from '../Exec/Exec.ts'
import * as FileSystemWorker from '../FileSystemWorker/FileSystemWorker.ts'

/**
 * Runs the compilation process using npm run compile
 * @param {string} cwd - The working directory to run npm run compile in
 * @param {boolean} useNice - Whether to use nice command for resource management
 */
export const runCompile = async (cwd: string, useNice: boolean, mainJsPath: string) => {
  let result 
  if (useNice) {
    result =  await exec('nice', ['-n', '10', 'npm', 'run', 'compile'], { cwd, reject:false  })
  } else {
    result=  await exec('npm', ['run', 'compile'], { cwd, reject:false  })
  }

  if(result.exitCode){
    console.log(`[repository] tsc exitCode: ${result.exitCode}`)
    console.log(`[repository] tsc stdout: ${result.stdout}`)
    console.log(`[repository] tsc stderr: ${result.stderr}`)
  }

  // Verify build was successful
  if (!(await FileSystemWorker.pathExists(mainJsPath))) {
    throw new Error('Build failed: out/main.js not found after compilation')
  }
}
