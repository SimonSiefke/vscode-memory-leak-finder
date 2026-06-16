import { mkdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { downloadAndUnzipVSCode } from '@vscode/test-electron'
import { _electron as electron } from 'playwright'

const timeout = Number(process.env.PLAYWRIGHT_VSCODE_TIMEOUT || 60_000)
const version = process.env.VSCODE_VERSION || '1.124.2'
const workspaceRoot = process.env.GITHUB_WORKSPACE || process.cwd()
const cachePath = join(workspaceRoot, '.vscode-test')
const testRoot = join(tmpdir(), `playwright-vscode-${process.pid}`)
const userDataDir = join(testRoot, 'user-data')
const extensionsDir = join(testRoot, 'extensions')
const workspacePath = join(testRoot, 'workspace')

const log = (message) => {
  console.error(`[playwright-vscode-debug] ${message}`)
}

const withTimeout = async (label, promise, timeoutMs) => {
  let timeoutRef
  const timeoutPromise = new Promise((resolve, reject) => {
    timeoutRef = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`))
    }, timeoutMs)
  })
  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    clearTimeout(timeoutRef)
  }
}

let app

try {
  log(`platform=${process.platform} arch=${process.arch} node=${process.version} version=${version}`)
  await mkdir(userDataDir, { recursive: true })
  await mkdir(extensionsDir, { recursive: true })
  await mkdir(workspacePath, { recursive: true })

  const executablePath = await withTimeout(
    'downloadAndUnzipVSCode',
    downloadAndUnzipVSCode({
      cachePath,
      version,
    }),
    timeout,
  )
  log(`executablePath=${executablePath}`)

  const args = [
    '--wait',
    '--new-window',
    '--no-sandbox',
    '--disable-updates',
    '--skip-welcome',
    '--skip-release-notes',
    '--disable-workspace-trust',
    '--disable-extensions',
    '--user-data-dir',
    userDataDir,
    '--extensions-dir',
    extensionsDir,
    workspacePath,
  ]
  log(`launch args=${JSON.stringify(args)}`)

  app = await withTimeout(
    'electron.launch',
    electron.launch({
      args,
      executablePath,
      env: {
        ...process.env,
        ELECTRON_ENABLE_LOGGING: '1',
      },
    }),
    timeout,
  )
  log(`electron.launch resolved pid=${app.process()?.pid ?? '<unknown>'}`)

  app.process()?.stdout?.on('data', (data) => {
    log(`stdout ${data.toString().trimEnd()}`)
  })
  app.process()?.stderr?.on('data', (data) => {
    log(`stderr ${data.toString().trimEnd()}`)
  })

  const window = await withTimeout('electron.firstWindow', app.firstWindow(), timeout)
  log(`firstWindow resolved title=${JSON.stringify(await window.title())} url=${window.url()}`)

  const appInfo = await withTimeout(
    'electron.evaluate',
    app.evaluate(async ({ app: electronApp }) => {
      return {
        appPath: electronApp.getAppPath(),
        isReady: electronApp.isReady(),
        name: electronApp.getName(),
        version: electronApp.getVersion(),
      }
    }),
    timeout,
  )
  log(`appInfo=${JSON.stringify(appInfo)}`)
} catch (error) {
  log(`error=${error instanceof Error ? error.stack || error.message : String(error)}`)
  process.exitCode = 1
} finally {
  if (app) {
    try {
      await app.close()
      log('app closed')
    } catch (error) {
      log(`app close failed=${error instanceof Error ? error.message : String(error)}`)
    }
  }
  await rm(testRoot, { force: true, recursive: true })
}
