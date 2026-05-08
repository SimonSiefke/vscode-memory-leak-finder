import { spawn } from 'node:child_process'
import { createConnection } from 'node:net'
import type { CreateParams } from '../CreateParams/CreateParams.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'

const defaultAddress = '127.0.0.1:9888'
const defaultHost = '127.0.0.1'
const defaultName = 'Local SSH Server'
const defaultPort = 9888
const defaultScriptPath = '/home/simon/.cache/repos/vscode/scripts/code-server.sh'
const defaultTimeout = 120_000
const directAddRemoteAgentHostCommandId = 'sessions.remoteAgentHost.add'
const addRemoteAgentHostCommandLabel = 'Add Remote Agent Host...'

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
  return new Promise((resolve) => {
    const socket = createConnection({ host, port })
    const finish = (value: boolean) => {
      socket.removeAllListeners()
      socket.destroy()
      resolve(value)
    }
    socket.once('connect', () => finish(true))
    socket.once('error', () => finish(false))
    socket.setTimeout(500, () => finish(false))
  })
}

const sleep = async (milliseconds: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, milliseconds))
}

const waitForExit = async (childProcess: any, milliseconds: number): Promise<void> => {
  if (!childProcess || childProcess.exitCode !== null || childProcess.signalCode !== null) {
    return
  }
  await Promise.race([
    new Promise<void>((resolve) => {
      childProcess.once('exit', () => resolve())
    }),
    sleep(milliseconds),
  ])
}

export const create = ({ electronApp, expect, ideVersion, page, platform, VError }: CreateParams) => {
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
        state.exitCode = undefined
        state.signalCode = undefined
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
    async connect({ address = defaultAddress, name = defaultName } = {}): Promise<void> {
      try {
        await page.waitForIdle()
        const commandResult = await page.evaluate({
          awaitPromise: true,
          expression: `((async () => {
  const commandId = ${JSON.stringify(directAddRemoteAgentHostCommandId)}
  const candidates = [
    globalThis.workbench?.commands,
    globalThis.vscode?.commands,
    globalThis.monaco?.commands,
    globalThis.mainWindow?.commands,
  ]
  for (const commands of candidates) {
    if (commands && typeof commands.executeCommand === 'function') {
      try {
        await commands.executeCommand(commandId)
        return true
      } catch {
        return false
      }
    }
  }
  return false
})())`,
          returnByValue: true,
        })
        const quickPick = QuickPick.create({
          electronApp,
          expect,
          ideVersion,
          page,
          platform,
          VError,
        })
        if (!commandResult) {
          await quickPick.executeCommand(addRemoteAgentHostCommandLabel, {
            pressKeyOnce: true,
            stayVisible: true,
          })
        }
        await quickPick.type(address)
        await quickPick.pressEnter()
        await quickPick.type(name)
        await quickPick.pressEnter()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to connect to SSH server ${address}`)
      }
    },
    async shouldBeConnected({ address = defaultAddress, name = defaultName } = {}): Promise<void> {
      try {
        await page.waitForIdle()
        const remoteIndicator = page.locator('#status\\.host').first()
        await expect(remoteIndicator).toBeVisible({ timeout: 30_000 })
        const text = ((await remoteIndicator.textContent()) || '').trim()
        const ariaLabel = (await remoteIndicator.getAttribute('aria-label')) || ''
        if (text.includes('Open a Remote Window') || ariaLabel.includes('Open a Remote Window')) {
          const bodyText = (await page.locator('body').textContent()) || ''
          if (!bodyText.includes(name) && !bodyText.includes(address)) {
            throw new Error(`Remote indicator did not change after connecting. text=${text} ariaLabel=${ariaLabel}`)
          }
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