import { execFile } from 'node:child_process'
import { stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { promisify } from 'node:util'

interface ExecFileError extends Error {
  readonly stdout?: string
  readonly stderr?: string
}

const execFileAsync = promisify(execFile)

const pathExists = async (path: string): Promise<boolean> => {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

const runBuildCommand = async (repoPath: string, useNice: boolean, buildTask: string): Promise<void> => {
  try {
    if (useNice) {
      await execFileAsync('nice', ['-n', '10', 'npx', 'gulp', buildTask], { cwd: repoPath, maxBuffer: 1024 * 1024 * 64 })
      return
    }
    await execFileAsync('npx', ['gulp', buildTask], { cwd: repoPath, maxBuffer: 1024 * 1024 * 64 })
  } catch (error) {
    const execError = error as ExecFileError
    console.log(`[launch-worker] ${buildTask} failed; verifying whether executable was produced anyway`)
    if (execError.stdout) {
      console.log(`[launch-worker] ${buildTask} stdout: ${execError.stdout}`)
    }
    if (execError.stderr) {
      console.log(`[launch-worker] ${buildTask} stderr: ${execError.stderr}`)
    }
  }
}

export const buildLocalVscodeMinified = async (platform: string, arch: string, repoPath: string, useNice: boolean): Promise<string> => {
  if (platform !== 'linux') {
    throw new Error(`--build-vscode-minified is not supported on ${platform}`)
  }
  const buildTask = `vscode-${platform}-${arch}-min`
  const executablePath = join(dirname(repoPath), `VSCode-${platform}-${arch}`, 'code-oss')
  if (await pathExists(executablePath)) {
    return executablePath
  }
  await runBuildCommand(repoPath, useNice, buildTask)
  try {
    await stat(executablePath)
  } catch {
    throw new Error(`Build failed: minified VS Code executable not found at ${executablePath}`)
  }
  return executablePath
}
