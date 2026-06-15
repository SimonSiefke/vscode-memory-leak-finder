import { dirname } from 'node:path'
import { exec } from '../Exec/Exec.ts'
import * as FileSystemWorker from '../FileSystemWorker/FileSystemWorker.ts'
import { getNpmPathFromNvmrc } from '../GetNpmPathFromNvmrc/GetNpmPathFromNvmrc.ts'
import * as Path from '../Path/Path.ts'

const runBuildCommand = async (cwd: string, useNice: boolean, npmPath: string, args: readonly string[]) => {
  if (useNice) {
    return exec('nice', ['-n', '10', npmPath, ...args], { cwd, reject: false })
  }
  return exec(npmPath, [...args], { cwd, reject: false })
}

/**
 * Runs the compilation process using npm run compile
 * @param {string} cwd - The working directory to run npm run compile in
 * @param {boolean} useNice - Whether to use nice command for resource management
 */
export const runCompile = async (cwd: string, useNice: boolean, mainJsPath: string) => {
  const npmPath = await getNpmPathFromNvmrc(cwd)
  const compileResult = await runBuildCommand(cwd, useNice, npmPath, ['run', 'compile'])

  if (compileResult.exitCode) {
    console.log(`[repository] tsc exitCode: ${compileResult.exitCode}`)
    console.log(`[repository] tsc stdout: ${compileResult.stdout}`)
    console.log(`[repository] tsc stderr: ${compileResult.stderr}`)
  }

  const npxPath = Path.join(dirname(npmPath), 'npx')
  const transpileResult = await runBuildCommand(cwd, useNice, npxPath, ['gulp', 'transpile-client-esbuild'])

  if (transpileResult.exitCode) {
    console.log(`[repository] gulp-transpile-client-esbuild exitCode: ${transpileResult.exitCode}`)
    console.log(`[repository] gulp-transpile-client-esbuild stdout: ${transpileResult.stdout}`)
    console.log(`[repository] gulp-transpile-client-esbuild stderr: ${transpileResult.stderr}`)
  }

  // Verify build was successful
  if (!(await FileSystemWorker.pathExists(mainJsPath))) {
    throw new Error('Build failed: out/main.js not found after compilation')
  }
}
