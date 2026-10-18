import { dirname } from 'node:path'
import { exec } from '../Exec/Exec.ts'
import * as FileSystemWorker from '../FileSystemWorker/FileSystemWorker.ts'
import { getNpmPathFromNvmrc } from '../GetNpmPathFromNvmrc/GetNpmPathFromNvmrc.ts'
import * as Path from '../Path/Path.ts'
import { withCopilotPackagingWorkaround } from '../WithCopilotPackagingWorkaround/WithCopilotPackagingWorkaround.ts'

const runBuildCommand = async (cwd: string, useNice: boolean, npmPath: string, args: readonly string[]) => {
  const env = { ...process.env, PATH: `${dirname(npmPath)}:${process.env.PATH ?? ''}` }
  if (useNice) {
    return exec('nice', ['-n', '10', npmPath, ...args], { cwd, reject: false, env })
  }
  return exec(npmPath, [...args], { cwd, reject: false, env })
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

export const runMinifiedBuild = async (cwd: string, platform: string, arch: string, useNice: boolean, executablePath: string) => {
  const npmPath = await getNpmPathFromNvmrc(cwd)
  const npxPath = Path.join(dirname(npmPath), 'npx')
  const buildTask = `vscode-${platform}-${arch}-min`
  const build = () => runBuildCommand(cwd, useNice, npxPath, ['gulp', buildTask])
  const result =
    process.env.VSCODE_BENCHMARK_COPILOT_PACKAGING_WORKAROUND === 'true' ? await withCopilotPackagingWorkaround(cwd, build) : await build()

  if (result.exitCode) {
    console.log(`[repository] ${buildTask} exitCode: ${result.exitCode}`)
    console.log(`[repository] ${buildTask} stdout: ${result.stdout}`)
    console.log(`[repository] ${buildTask} stderr: ${result.stderr}`)
    throw new Error(`Build failed: ${buildTask} exited with code ${result.exitCode}`)
  }

  if (!(await FileSystemWorker.pathExists(executablePath))) {
    throw new Error(`Build failed: minified VS Code executable not found at ${executablePath}`)
  }
}
