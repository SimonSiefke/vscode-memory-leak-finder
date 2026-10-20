import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { access, cp, mkdir, mkdtemp, readFile, rename, rm } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

const fixturePath = join(import.meta.dirname, '../fixture')

export const getElectronBinary = (workspace: string): string => {
  const dist = join(workspace, 'node_modules/electron/dist')
  if (process.platform === 'darwin') return join(dist, 'Electron.app/Contents/MacOS/Electron')
  return join(dist, process.platform === 'win32' ? 'electron.exe' : 'electron')
}

const isInstalled = async (workspace: string): Promise<boolean> => {
  try {
    await access(getElectronBinary(workspace))
    return true
  } catch {
    return false
  }
}

export const prepare = async (cacheRoot = join(process.env.XDG_CACHE_HOME || join(homedir(), '.cache'), 'electron-memory-leak-finder')) => {
  const files = ['package.json', 'package-lock.json', 'main.cjs', 'lifecycle-child.cjs']
  const hash = createHash('sha256').update(`${process.platform}-${process.arch}`)
  for (const file of files) hash.update(await readFile(join(fixturePath, file)))
  const workspace = join(cacheRoot, hash.digest('hex'))
  await mkdir(cacheRoot, { recursive: true })
  if (await isInstalled(workspace)) {
    console.log(`Reusing Electron workspace: ${workspace}`)
    return workspace
  }
  const lock = `${workspace}.lock`
  const deadline = Date.now() + 300_000
  while (true) {
    try {
      await mkdir(lock)
      break
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
      if (Date.now() > deadline) throw new Error(`Timed out waiting for Electron install lock: ${lock}`)
      await delay(250)
    }
  }
  let staging: string | undefined
  try {
    if (await isInstalled(workspace)) return workspace
    staging = await mkdtemp(join(cacheRoot, '.install-'))
    for (const file of files) await cp(join(fixturePath, file), join(staging, file))
    console.log(`Installing cached Electron workspace: ${workspace}`)
    const installCommands: readonly [string, string[]][] = [
      [process.platform === 'win32' ? 'npm.cmd' : 'npm', ['ci', '--no-audit', '--no-fund']],
      [process.execPath, ['node_modules/electron/install.js']],
    ]
    for (const [command, args] of installCommands) {
      const child = spawn(command, args, { cwd: staging, stdio: 'inherit', timeout: 240_000 })
      await new Promise<void>((resolve, reject) => {
        child.once('error', reject)
        child.once('exit', (code, signal) => {
          if (code === 0) resolve()
          else reject(new Error(`Electron install failed: ${command} (${signal || code})`))
        })
      })
    }
    if (!(await isInstalled(staging))) throw new Error('Electron install did not produce an executable')
    await rm(workspace, { recursive: true, force: true })
    await rename(staging, workspace)
    return workspace
  } finally {
    if (staging) await rm(staging, { recursive: true, force: true })
    await rm(lock, { recursive: true, force: true })
  }
}
