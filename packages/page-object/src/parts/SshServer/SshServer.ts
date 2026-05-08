import { spawn } from 'node:child_process'
import { createConnection } from 'node:net'
import type { CreateParams } from '../CreateParams/CreateParams.ts'

const defaultHost = '127.0.0.1'
const defaultPort = 9888
const defaultScriptPath = '/home/simon/.cache/repos/vscode/scripts/code-server.sh'
const defaultTimeout = 120_000
const defaultUrl = 'http://127.0.0.1:9888/'

type ServerState = {
  readonly output: string[]
  childProcess?: any
  exitCode?: number | null
  signalCode?: NodeJS.Signals | null
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
  await Promise.race([
    promise,
    sleep(milliseconds),
  ])
}

const isNavigationTransitionError = (error: unknown): boolean => {
  const message = String(error && (error as Error).message ? (error as Error).message : error)
  return (
    message.includes('Execution context was destroyed') ||
    message.includes('Cannot find context with specified id') ||
    message.includes('uniqueContextId not found')
  )
}

export const create = ({ electronApp, page, reconnectDevtools, VError }: CreateParams) => {
  const state: ServerState = {
    output: [],
  }

  return {
    async launch(): Promise<void> {
      try {
        if (state.childProcess && state.childProcess.exitCode === null && state.childProcess.signalCode === null) {
          return
        }
        const childProcess = spawn(defaultScriptPath, ['--without-connection-token'], {
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
      } catch (error) {
        throw new VError(error, `Failed to launch SSH server`)
      }
    },
    async waitForPort({ host = defaultHost, port = defaultPort, timeout = defaultTimeout } = {}): Promise<void> {
      try {
        const start = Date.now()
        while (Date.now() - start < timeout) {
          if (await isPortOpen(port, host)) {
            return
          }
          if (state.childProcess && state.childProcess.exitCode !== null) {
            throw new Error(`SSH server exited early with code ${state.childProcess.exitCode}\n${getOutput(state)}`)
          }
          if (state.childProcess && state.childProcess.signalCode !== null) {
            throw new Error(`SSH server exited early with signal ${state.childProcess.signalCode}\n${getOutput(state)}`)
          }
          await sleep(250)
        }
        throw new Error(`Timed out waiting for ${host}:${port} to accept connections\n${getOutput(state)}`)
      } catch (error) {
        throw new VError(error, `Failed to wait for SSH server port ${host}:${port}`)
      }
    },
    async connect({ url = defaultUrl } = {}): Promise<void> {
      try {
        const reconnectPromise = reconnectDevtools
          ? reconnectDevtools().then(
              () => true,
              () => false,
            )
          : undefined

        try {
          await electronApp.evaluate(`(() => {
  const electron = globalThis._____electron
  const { BrowserWindow } = electron
  const browserWindow = BrowserWindow.getAllWindows()[0]
  if (!browserWindow) {
    throw new Error('no browser window found')
  }
  browserWindow.loadURL(${JSON.stringify(url)})
  return true
})()`)
        } catch (error) {
          if (!isNavigationTransitionError(error)) {
            throw error
          }
        }

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
          await sleep(250)
        }
        throw new Error(`Timed out waiting to navigate to ${url}`)
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
