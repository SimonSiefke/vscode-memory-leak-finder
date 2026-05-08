import type { CreateParams } from '../CreateParams/CreateParams.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'
import * as Electron from '../Electron/Electron.ts'

export type ConnectToSshOptions = {
  readonly alias?: string
  readonly host?: string
  readonly port?: number
  readonly user?: string
  readonly workspacePath?: string
}

type QuickPickApi = {
  executeCommand: (
    command: string,
    options?: { pressKeyOnce?: boolean; stayVisible?: boolean | 'dont-care'; stopsApplication?: boolean },
  ) => Promise<void>
  getVisibleCommands: () => Promise<string[]>
  pressEnter: () => Promise<void>
  select: (text: string | RegExp, stayVisible?: boolean | 'dont-care') => Promise<void>
  showCommands: (options?: { pressKeyOnce?: boolean }) => Promise<void>
  type: (value: string) => Promise<void>
}

type SshClientDependencies = {
  readonly createQuickPick: () => QuickPickApi
  readonly sleep: (milliseconds: number) => Promise<void>
}

const resolveSshTarget = ({ alias, host = '127.0.0.1', port, user }: ConnectToSshOptions): string => {
  if (alias) {
    return alias
  }
  if (typeof port === 'number') {
    return user ? `${user}@${host}:${port}` : `${host}:${port}`
  }
  throw new Error(`alias or port is required`)
}

const getSshStatusBarSelector = (target: string): string => {
  return `.statusbar-item-label[aria-label*="SSH: ${target}"]`
}

const sleep = async (milliseconds: number): Promise<void> => {
  const { promise, resolve } = Promise.withResolvers<void>()
  setTimeout(resolve, milliseconds)
  await promise
}

export const create = ({ browserRpc, electronApp, expect, page, platform, reconnectDevtools, VError, ideVersion }: CreateParams) => {
  return createWithDependencies(
    reconnectDevtools
      ? { browserRpc, electronApp, expect, ideVersion, page, platform, reconnectDevtools, VError }
      : { browserRpc, electronApp, expect, ideVersion, page, platform, VError },
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
      sleep,
    },
  )
}

export const createWithDependencies = (
  { expect, page, VError, electronApp, ideVersion, platform }: CreateParams,
  dependencies: SshClientDependencies,
) => {
  const defaultValue = '/home/simon/'

  return {
    lastValue: defaultValue,
    async connectToSshPart1(options: ConnectToSshOptions): Promise<void> {
      try {
        const target = resolveSshTarget(options)
        const quickPick = dependencies.createQuickPick()
        await page.waitForIdle()
        await quickPick.executeCommand(WellKnownCommands.RemoteSshConnectCurrentWindowToHost, {
          stayVisible: true,
          pressKeyOnce: true,
        })
        await page.waitForIdle()
        const refreshPromise = page.waitForRefresh()
        const maxAttempts = 10
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          try {
            await quickPick.select(new RegExp(target))
            break
          } catch {
            await dependencies.sleep(1000)
          }
        }
        await refreshPromise
        const newPage = await page.refresh()
        await page.rebind(newPage)
      } catch (error) {
        throw new VError(error, `Failed to connect to ssh server`)
      }
    },
    async connectToSshPart2(options: ConnectToSshOptions): Promise<void> {
      try {
        await page.waitForIdle()
        const statusBarItemFinished = page.locator(getSshStatusBarSelector(resolveSshTarget(options)))
        await expect(statusBarItemFinished).toBeVisible({ timeout: 60_000 })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to connect to ssh server`)
      }
    },

    async connectToSsh(options: ConnectToSshOptions): Promise<void> {
      try {
        await this.connectToSshPart1(options)
        await this.connectToSshPart2(options)
      } catch (error) {
        throw new VError(error, `Failed to connect to ssh server`)
      }
    },
    async openFolder(options: ConnectToSshOptions): Promise<void> {
      try {
        const folderPath = options.workspacePath || `/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-test-workspace` // TODO
        const quickPick = dependencies.createQuickPick()
        quickPick.executeCommand(WellKnownCommands.OpenFolder, {
          stayVisible: true,
          pressKeyOnce: true,
        })
        const input = page.locator(`[aria-label="Folder path - Open Folder"]`)
        await expect(input).toBeVisible()
        await page.waitForIdle()
        await expect(input).toBeFocused()
        await page.waitForIdle()
        await expect(input).toHaveValue(this.lastValue)
        this.lastValue = folderPath
        await page.waitForIdle()
        await input.clear()
        await page.waitForIdle()
        await expect(input).toHaveValue('')
        await page.waitForIdle()
        await input.type(folderPath)
        await page.waitForIdle()
        const okButton = page.locator('.quick-input-action .monaco-button.monaco-text-button', {
          hasText: 'OK',
        })
        await expect(okButton).toBeVisible()
        await page.waitForIdle()
        await okButton.focus()
        await page.waitForIdle()
        await expect(okButton).toBeFocused()
        await page.waitForIdle()
        const electron = Electron.create({
          page,
          expect,
          VError,
          electronApp,
          ideVersion,
          platform,
        })
        // TODO why sometimes popup comes?
        await electron.mockDialog({
          response: 0,
        })

        const refreshPromise = page.waitForRefresh()
        await page.keyboard.press('Enter')
        await refreshPromise
        const newPage = await page.refresh()
        await page.rebind(newPage)
        await this.connectToSshPart2(options)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to open folder`)
      }
    },
  }
}
