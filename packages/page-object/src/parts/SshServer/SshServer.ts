import { spawn } from 'node:child_process'
import { createConnection } from 'node:net'
import type { CreateParams } from '../CreateParams/CreateParams.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

const defaultHost = '127.0.0.1'
const defaultPort = 9888
const defaultScriptPath = '/home/simon/.cache/repos/vscode/scripts/code-server.sh' // TODO make this configurable
const defaultTimeout = 120_000
const defaultUrl = 'http://127.0.0.1:9888/'

type ServerState = {
  readonly output: string[]
  childProcess?: any
  exitCode?: number | null
  signalCode?: NodeJS.Signals | null
}

type WaitForPortOptions = {
  readonly host?: string
  readonly port?: number
  readonly timeout?: number
}

type SshServerDependencies = {
  readonly createQuickPick: () => {
    executeCommand: (command: string, options?: { pressKeyOnce?: boolean; stayVisible?: boolean | 'dont-care' }) => Promise<void>
    pressEnter: () => Promise<void>
    type: (value: string) => Promise<void>
  }
  readonly spawnProcess: typeof spawn
  readonly isPortOpen: (port: number, host: string) => Promise<boolean>
  readonly sleep: (milliseconds: number) => Promise<void>
}

type SshServerCreateParams = {
  readonly electronApp: any
  readonly expect?: any
  readonly ideVersion?: CreateParams['ideVersion']
  readonly page: any
  readonly platform?: string
  readonly reconnectDevtools?: () => Promise<void>
  readonly VError: any
}

const appendOutput = (state: ServerState, chunk: unknown): void => {
  const text = String(chunk || '')
  if (!text) {
    return
  }
  state.output.push(text)
  if (state.output.length > 200) {
    state.output.splice(0, state.output.length - 200)
  }
}

const getOutput = (state: ServerState): string => {
  return state.output.join('')
}

const isPortOpen = async (port: number, host: string): Promise<boolean> => {
  const { promise, resolve } = Promise.withResolvers<boolean>()
  const socket = createConnection({ host, port })
  const finish = (value: boolean) => {
    socket.removeAllListeners()
    socket.destroy()
    resolve(value)
  }
  socket.once('connect', () => finish(true))
  socket.once('error', () => finish(false))
  socket.setTimeout(500, () => finish(false))
  return promise
}

const sleep = async (milliseconds: number): Promise<void> => {
  const { promise, resolve } = Promise.withResolvers<void>()
  setTimeout(resolve, milliseconds)
  await promise
}

const waitForExit = async (childProcess: any, milliseconds: number): Promise<void> => {
  if (!childProcess || childProcess.exitCode !== null || childProcess.signalCode !== null) {
    return
  }
  const { promise, resolve } = Promise.withResolvers<void>()
  childProcess.once('exit', () => resolve())
  await Promise.race([promise, sleep(milliseconds)])
}

const isNavigationTransitionError = (error: unknown): boolean => {
  const message = String(error && (error as Error).message ? (error as Error).message : error)
  return (
    message.includes('Execution context was destroyed') ||
    message.includes('Cannot find context with specified id') ||
    message.includes('uniqueContextId not found')
  )
}

const waitForPortInternal = async (
  state: ServerState,
  dependencies: SshServerDependencies,
  { host = defaultHost, port = defaultPort, timeout = defaultTimeout }: WaitForPortOptions = {},
): Promise<void> => {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    if (await dependencies.isPortOpen(port, host)) {
      return
    }
    if (state.childProcess && state.childProcess.exitCode !== null) {
      throw new Error(`SSH server exited early with code ${state.childProcess.exitCode}\n${getOutput(state)}`)
    }
    if (state.childProcess && state.childProcess.signalCode !== null) {
      throw new Error(`SSH server exited early with signal ${state.childProcess.signalCode}\n${getOutput(state)}`)
    }
    await dependencies.sleep(250)
  }
  throw new Error(`Timed out waiting for ${host}:${port} to accept connections\n${getOutput(state)}`)
}

const waitForConnection = async (
  page: any,
  dependencies: SshServerDependencies,
  url: string,
  reconnectPromise?: Promise<boolean>,
): Promise<void> => {
  const reconnected = reconnectPromise ? await reconnectPromise : false
  let recoveredFromTransitionError = false

  if (!reconnected) {
    const refreshedPage = await page.refresh()
    await page.rebind(refreshedPage)
  }

  const start = Date.now()
  while (Date.now() - start < 30_000) {
    try {
      const href = await page.evaluate({
        expression: `(() => globalThis.location?.href || '')()`,
        returnByValue: true,
      })
      if (String(href).startsWith(url)) {
        await page.waitForIdle()
        return
      }
    } catch (error) {
      if (!recoveredFromTransitionError && isNavigationTransitionError(error)) {
        const refreshedPage = await page.refresh()
        await page.rebind(refreshedPage)
        recoveredFromTransitionError = true
      }
    }
    await dependencies.sleep(250)
  }
  throw new Error(`Timed out waiting to navigate to ${url}`)
}

export const create = ({ electronApp, expect, ideVersion, page, platform, reconnectDevtools, VError }: CreateParams) => {
  return createWithDependencies(
    reconnectDevtools
      ? { electronApp, expect, ideVersion, page, platform, reconnectDevtools, VError }
      : { electronApp, expect, ideVersion, page, platform, VError },
    {
      createQuickPick: () =>
        QuickPick.create({
          electronApp,
          expect,
          ideVersion,
          page,
          platform,
          VError,
        }),
      spawnProcess: spawn,
      isPortOpen,
      sleep,
    },
  )
}

export const createWithDependencies = ({ page, reconnectDevtools, VError }: SshServerCreateParams, dependencies: SshServerDependencies) => {
  const state: ServerState = {
    output: [],
  }

  return {
    async launch(): Promise<void> {
      try {
        if (!state.childProcess || state.childProcess.exitCode !== null || state.childProcess.signalCode !== null) {
          const childProcess = dependencies.spawnProcess(defaultScriptPath, ['--without-connection-token'], {
            detached: true,
            stdio: ['ignore', 'pipe', 'pipe'],
          })
          state.childProcess = childProcess
          childProcess.stdout.on('data', (chunk: unknown) => appendOutput(state, chunk))
          childProcess.stderr.on('data', (chunk: unknown) => appendOutput(state, chunk))
          childProcess.once('exit', (exitCode: number | null, signalCode: NodeJS.Signals | null) => {
            state.exitCode = exitCode
            state.signalCode = signalCode
          })
        }
        await waitForPortInternal(state, dependencies)
      } catch (error) {
        throw new VError(error, `Failed to launch SSH server`)
      }
    },
    async waitForPort({ host = defaultHost, port = defaultPort, timeout = defaultTimeout } = {}): Promise<void> {
      try {
        await waitForPortInternal(state, dependencies, { host, port, timeout })
      } catch (error) {
        throw new VError(error, `Failed to wait for SSH server port ${host}:${port}`)
      }
    },
    async connect({ url = defaultUrl } = {}): Promise<void> {
      try {
        const quickPick = dependencies.createQuickPick()
        const reconnectPromise = reconnectDevtools
          ? reconnectDevtools().then(
              () => true,
              () => false,
            )
          : undefined

        await page.waitForIdle()
        await quickPick.executeCommand(WellKnownCommands.RemoteSshConnectCurrentWindowToHost, {
          stayVisible: true,
        })
        await quickPick.type(url)
        try {
          await quickPick.pressEnter()
        } catch (error) {
          if (!isNavigationTransitionError(error)) {
            throw error
          }
        }
        await waitForConnection(page, dependencies, url, reconnectPromise)
      } catch (error) {
        throw new VError(error, `Failed to connect to SSH server ${url}`)
      }
    },
    async shouldBeConnected({ url = defaultUrl } = {}): Promise<void> {
      try {
        await page.waitForIdle()
        const href = await page.evaluate({
          expression: `(() => globalThis.location?.href || '')()`,
          returnByValue: true,
        })
        if (!String(href).startsWith(url)) {
          throw new Error(`Unexpected location after connecting: ${href}`)
        }
      } catch (error) {
        throw new VError(error, `Failed to verify SSH server connection`)
      }
    },
    async dispose(): Promise<void> {
      try {
        const childProcess = state.childProcess
        if (!childProcess) {
          return
        }
        if (childProcess.exitCode !== null || childProcess.signalCode !== null) {
          state.childProcess = undefined
          return
        }
        try {
          process.kill(-childProcess.pid, 'SIGTERM')
        } catch {
          childProcess.kill('SIGTERM')
        }
        await waitForExit(childProcess, 5_000)
        if (childProcess.exitCode === null && childProcess.signalCode === null) {
          try {
            process.kill(-childProcess.pid, 'SIGKILL')
          } catch {
            childProcess.kill('SIGKILL')
          }
          await waitForExit(childProcess, 1_000)
        }
        state.childProcess = undefined
      } catch (error) {
        throw new VError(error, `Failed to dispose SSH server`)
      }
    },
  }
}
