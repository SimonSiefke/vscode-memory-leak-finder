import { spawn, type ChildProcess } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { get } from 'node:http'
import { createServer } from 'node:net'
import { join } from 'node:path'
import nodeProcess, { env, platform } from 'node:process'
import type { TestContext } from '../types.js'

type ProjectKind = 'next' | 'vite'
type ServerMode = 'dev' | 'preview'

interface ProjectConfig {
  readonly heading: string
  readonly initialPath: string
  readonly kind: ProjectKind
  readonly name: string
  readonly path: string
}

const root = join(import.meta.dirname, '..', '..', '..')
const minimalReproductionsPath = join(root, '.minimal-reproductions')
const npmCommand = platform === 'win32' ? 'npm.cmd' : 'npm'

let serverProcess: ChildProcess | undefined
let serverLogs = ''

const headings: Record<string, string> = {
  'headlessui-closebutton-link': 'Headless UI CloseButton link repro',
  'headlessui-theme-radiogroup': 'Headless UI theme RadioGroup repro',
  'next-rsc-navigation': 'Get started with Tailwind CSS',
  'next-tailwind-shaped-docs': 'Get started with Tailwind CSS',
  'next-tailwind-shaped-docs-next-link-only': 'Get started with Tailwind CSS',
  'next-tailwind-shaped-docs-router-anchor': 'Get started with Tailwind CSS',
  'next-tailwind-shaped-docs-static-sidebar': 'Get started with Tailwind CSS',
  'react-aria-hover-global-listeners': 'React Aria hover global listeners repro',
  'react-aria-synthetic-blur': 'React Aria synthetic blur repro',
  'react-fiber-toggle-baseline': 'React Fiber toggle baseline',
}

const escapeRegExp = (value: string): string => {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const getKnownProjects = (): readonly string[] => {
  if (!existsSync(minimalReproductionsPath)) {
    return []
  }
  return readdirSync(minimalReproductionsPath, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)
    .sort()
}

const parseServerMode = (): ServerMode => {
  const raw = env.MINIMAL_REPRODUCTION_SERVER || 'preview'
  switch (raw) {
    case 'dev':
      return 'dev'
    case 'preview':
    case 'prod':
    case 'production':
      return 'preview'
    default:
      throw new Error(`Unsupported MINIMAL_REPRODUCTION_SERVER "${raw}". Expected "preview" or "dev".`)
  }
}

const parseCycles = (): number => {
  const raw = env.MINIMAL_REPRODUCTION_CYCLES || '1'
  const cycles = Number.parseInt(raw, 10)
  if (!Number.isInteger(cycles) || cycles < 1) {
    throw new Error(`MINIMAL_REPRODUCTION_CYCLES must be a positive integer, got "${raw}"`)
  }
  return cycles
}

const getFreePort = async (): Promise<number> => {
  const server = createServer()
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const address = server.address()
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  })
  if (!address || typeof address === 'string') {
    throw new Error('Failed to allocate a local port')
  }
  return address.port
}

const getProjectConfig = (): ProjectConfig => {
  const name = env.MINIMAL_REPRODUCTION
  const knownProjects = getKnownProjects()
  if (!name) {
    throw new Error(`MINIMAL_REPRODUCTION is required. Known projects: ${knownProjects.join(', ') || '<none>'}`)
  }
  if (!knownProjects.includes(name)) {
    throw new Error(`Unknown minimal reproduction "${name}". Known projects: ${knownProjects.join(', ') || '<none>'}`)
  }
  const projectPath = join(minimalReproductionsPath, name)
  const packageJsonPath = join(projectPath, 'package.json')
  if (!existsSync(packageJsonPath)) {
    throw new Error(`Minimal reproduction package.json not found: ${packageJsonPath}`)
  }
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
  const dependencies = packageJson.dependencies || {}
  const kind: ProjectKind = dependencies.next ? 'next' : 'vite'
  return {
    heading: headings[name] || name,
    initialPath: kind === 'next' ? '/installation' : '/',
    kind,
    name,
    path: projectPath,
  }
}

const runCommand = async (args: readonly string[], cwd: string, timeout = 180_000): Promise<void> => {
  const child = spawn(npmCommand, args, {
    cwd,
    env: nodeProcess.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let output = ''
  child.stdout.on('data', (chunk) => {
    output += String(chunk)
  })
  child.stderr.on('data', (chunk) => {
    output += String(chunk)
  })
  const timeoutId = setTimeout(() => {
    child.kill('SIGTERM')
  }, timeout)
  try {
    const exitCode = await new Promise<number | null>((resolve, reject) => {
      child.once('error', reject)
      child.once('exit', resolve)
    })
    if (exitCode !== 0) {
      throw new Error(`Command failed: npm ${args.join(' ')}\n${output.slice(-6000)}`)
    }
  } finally {
    clearTimeout(timeoutId)
  }
}

const getServerArgs = (config: ProjectConfig, mode: ServerMode, port: number): readonly string[] => {
  if (mode === 'dev') {
    return config.kind === 'next' ? ['run', 'dev', '--', '-p', `${port}`] : ['run', 'dev', '--', '--port', `${port}`]
  }
  return config.kind === 'next' ? ['run', 'start', '--', '-p', `${port}`] : ['run', 'preview', '--', '--port', `${port}`]
}

const startServer = (config: ProjectConfig, mode: ServerMode, port: number): void => {
  serverLogs = ''
  const child = spawn(npmCommand, getServerArgs(config, mode, port), {
    cwd: config.path,
    detached: platform !== 'win32',
    env: nodeProcess.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  child.stdout?.on('data', (chunk) => {
    serverLogs += String(chunk)
    serverLogs = serverLogs.slice(-6000)
  })
  child.stderr?.on('data', (chunk) => {
    serverLogs += String(chunk)
    serverLogs = serverLogs.slice(-6000)
  })
  serverProcess = child
}

const requestUrl = async (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const request = get(url, (response) => {
      response.resume()
      resolve(Boolean(response.statusCode && response.statusCode < 500))
    })
    request.once('error', () => {
      resolve(false)
    })
    request.setTimeout(1000, () => {
      request.destroy()
      resolve(false)
    })
  })
}

const waitForServer = async (url: string): Promise<void> => {
  const start = Date.now()
  while (Date.now() - start < 60_000) {
    if (serverProcess && (serverProcess.exitCode !== null || serverProcess.signalCode !== null)) {
      throw new Error(`Minimal reproduction server exited early.\n${serverLogs}`)
    }
    if (await requestUrl(url)) {
      return
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(`Timed out waiting for minimal reproduction server at ${url}.\n${serverLogs}`)
}

const stopServer = async (): Promise<void> => {
  const child = serverProcess
  serverProcess = undefined
  if (!child || child.exitCode !== null || child.signalCode !== null) {
    return
  }
  const waitForExit = new Promise<void>((resolve) => {
    child.once('exit', () => resolve())
  })
  try {
    if (platform === 'win32' || !child.pid) {
      child.kill('SIGTERM')
    } else {
      nodeProcess.kill(-child.pid, 'SIGTERM')
    }
  } catch {
    child.kill('SIGTERM')
  }
  await Promise.race([
    waitForExit,
    new Promise<void>((resolve) => {
      setTimeout(resolve, 3000)
    }),
  ])
  if (child.exitCode === null && child.signalCode === null) {
    try {
      if (platform === 'win32' || !child.pid) {
        child.kill('SIGKILL')
      } else {
        nodeProcess.kill(-child.pid, 'SIGKILL')
      }
    } catch {
      child.kill('SIGKILL')
    }
  }
}

const verifyLeakHooksExpression = `(() => {
  if (typeof window.LEAK_TEST_FORWARD !== 'function') {
    throw new Error('Expected window.LEAK_TEST_FORWARD to be a function')
  }
  if (typeof window.LEAK_TEST_BACKWARD !== 'function') {
    throw new Error('Expected window.LEAK_TEST_BACKWARD to be a function')
  }
})()`

export const setup = async ({ Editor, Notification, SideBar, SimpleBrowser, Workspace }: TestContext): Promise<void> => {
  try {
    const config = getProjectConfig()
    const serverMode = parseServerMode()
    const port = await getFreePort()
    const url = `http://127.0.0.1:${port}${config.initialPath}`

    await Workspace.setFiles([])
    await Editor.closeAll()
    await SideBar.hide()
    await Notification.closeAll({ force: true })

    if (serverMode === 'preview') {
      await runCommand(['run', 'build'], config.path)
    }
    startServer(config, serverMode, port)
    await waitForServer(url)

    await SimpleBrowser.show({
      url,
    })
    await SimpleBrowser.shouldHaveText({
      selector: 'h1',
      text: config.heading,
      urlPattern: new RegExp(`^${escapeRegExp(url)}`),
    })
    await SimpleBrowser.executeJavaScript({
      expression: verifyLeakHooksExpression,
    })
  } catch (error) {
    await stopServer()
    throw error
  }
}

export const run = async ({ SimpleBrowser }: TestContext): Promise<void> => {
  const cycles = parseCycles()
  await SimpleBrowser.executeJavaScript({
    expression: `(async () => {
  for (let i = 0; i < ${cycles}; i++) {
    await window.LEAK_TEST_FORWARD()
    await window.LEAK_TEST_BACKWARD()
  }
})()`,
    timeout: Math.max(180_000, cycles * 60_000),
  })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await stopServer()
  await Editor.closeAll()
}
