import { spawn } from 'node:child_process'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

export const writeJson = async (path: string, value: unknown): Promise<void> => {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(`${path}.tmp`, JSON.stringify(value, null, 2) + '\n')
  await rename(`${path}.tmp`, path)
}

export const readJson = async <T>(path: string): Promise<T> => JSON.parse(await readFile(path, 'utf8')) as T

export const command = (
  executable: string,
  args: string[],
  options: { cwd?: string; timeout?: number; inherit?: boolean; env?: NodeJS.ProcessEnv } = {},
): Promise<string> =>
  new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
      ...(options.cwd ? { cwd: options.cwd } : {}),
      stdio: options.inherit ? 'inherit' : ['ignore', 'pipe', 'pipe'],
      detached: true,
      env: { ...process.env, ...options.env },
    })
    let stdout = ''
    let stderr = ''
    child.stdout?.on('data', (chunk: Buffer) => {
      stdout = (stdout + chunk.toString()).slice(-4 * 1024 * 1024)
    })
    child.stderr?.on('data', (chunk: Buffer) => {
      stderr = (stderr + chunk.toString()).slice(-4 * 1024 * 1024)
    })
    const timer = setTimeout(() => {
      if (child.pid) {
        try {
          process.kill(-child.pid, 'SIGKILL')
        } catch {}
      }
    }, options.timeout ?? 300_000)
    child.once('error', (error) => {
      clearTimeout(timer)
      reject(error)
    })
    child.once('close', (code, signal) => {
      clearTimeout(timer)
      if (code !== 0) reject(new Error(`${executable} exited ${code ?? signal}: ${stderr}\n${stdout}`))
      else resolve(stdout.trim())
    })
  })

export const errorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error))
