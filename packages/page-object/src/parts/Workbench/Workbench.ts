import type { CreateParams } from '../CreateParams/CreateParams.ts'
import * as Electron from '../Electron/Electron.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

type ConnectToSshOptions = {
  readonly alias?: string
  readonly host?: string
  readonly port?: number
  readonly user?: string
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

type WorkbenchDependencies = {
  readonly createQuickPick: () => QuickPickApi
  readonly sleep: (milliseconds: number) => Promise<void>
}

export interface ISimplifedWindow {
  readonly close: () => Promise<void>
  readonly openFolderFromExplorer: () => Promise<void>
  readonly sessionRpc?: any
  readonly locator?: (selector: string) => any
  readonly shouldHaveExplorerItem: (direntName: string) => Promise<void>
  readonly shouldHaveTitleContaining: (value: string) => Promise<void>
  readonly waitForIdle: () => Promise<void>
  readonly shouldBeVisible: () => Promise<void>
}

const createLocatorProxy = (sessionRpc: any, selector: string, sessionId?: string) => {
  return {
    objectType: 'locator',
    rpc: sessionRpc,
    sessionRpc,
    sessionId,
    selector,
    hasText: undefined,
    locator(subSelector: string) {
      return createLocatorProxy(sessionRpc, `${selector} ${subSelector}`, sessionId)
    },
  }
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
  { browserRpc, electronApp, expect, page, platform, VError, ideVersion }: CreateParams,
  dependencies: WorkbenchDependencies,
) => {
  const selectRemoteHostPlatform = async (): Promise<void> => {
    const input = page.locator(`[aria-label^="Select the platform of the remote host"]`)
    for (let attempt = 0; attempt < 10; attempt++) {
      if (await input.isVisible()) {
        await expect(input).toBeVisible()
        await expect(input).toBeFocused()
        const quickPick = dependencies.createQuickPick()
        await quickPick.select('Linux')
        await page.waitForIdle()
        return
      }
      await dependencies.sleep(1000)
    }
  }

  return {
    async connectToSshPart1(options: ConnectToSshOptions): Promise<void> {
      const target = resolveSshTarget(options)
      const quickPick = dependencies.createQuickPick()
      await page.waitForIdle()
      await quickPick.executeCommand(WellKnownCommands.RemoteSshConnectCurrentWindowToHost, {
        stayVisible: true,
        pressKeyOnce: true,
      })
      for (let attempt = 0; attempt < 10; attempt++) {
        try {
          await quickPick.select(new RegExp(target))
          return
        } catch {
          await dependencies.sleep(1000)
        }
      }
      await quickPick.type(target)
      await page.waitForIdle()
      await quickPick.pressEnter()
    },
    async connectToSshPart2(_options: ConnectToSshOptions): Promise<void> {
      // TODO avoid hardcoded timeout
      // would need to wait dynamically for page created/reloaded event
      await new Promise((r) => {
        setTimeout(r, 3000)
      })
      const refreshedPage = await page.refresh()
      await page.rebind(refreshedPage)
      return refreshedPage
    },
    async connectToSshPart3(options: ConnectToSshOptions): Promise<void> {
      await selectRemoteHostPlatform()
      await page.waitForIdle()
      const statusBarItemFinished = page.locator(getSshStatusBarSelector(resolveSshTarget(options)))
      await expect(statusBarItemFinished).toBeVisible({ timeout: 60_000 })
    },
    async connectToSsh(options: ConnectToSshOptions): Promise<void> {
      try {
        // TODO this is probably a race condition and bad
        const refreshPromise = page.waitForRefresh()
        await this.connectToSshPart1(options)
        await refreshPromise
        await this.connectToSshPart2(options)
        await this.connectToSshPart3(options)
      } catch (error) {
        throw new VError(error, `Failed to connect to ssh server`)
      }
    },
    async openFolder(): Promise<void> {
      try {
        await page.waitForIdle()
        const quickPick = dependencies.createQuickPick()
        const refreshPromise = page.waitForRefresh()
        await quickPick.executeCommand('File: Open Folder...', {
          pressKeyOnce: true,
          stopsApplication: true,
        })
        await refreshPromise
        for (let attempt = 0; attempt < 10; attempt++) {
          const refreshedPage = await page.refresh()
          await page.rebind(refreshedPage)
          try {
            const workbench = page.locator('.monaco-workbench')
            await expect(workbench).toBeVisible({ timeout: 1000 })
            await page.waitForIdle()
            return
          } catch {
            await dependencies.sleep(1000)
          }
        }
        throw new Error('Timed out waiting for workbench after opening folder')
      } catch (error) {
        throw new VError(error, `Failed to open folder`)
      }
    },
    async waitForNewWindow({ timeout }: { timeout: number }) {
      const { promise, resolve } = Promise.withResolvers<string>()

      if (!browserRpc) {
        throw new Error(`browser rpc is required`)
      }

      let targetCaptured = false

      const cleanup = () => {
        browserRpc.off('Target.attachedToTarget', handleNewTarget)
        clearTimeout(timeoutRef)
      }

      const handleTimeout = () => {
        cleanup()
        resolve('')
      }

      const handleNewTarget = (message: any): void => {
        if (targetCaptured) {
          return
        }
        targetCaptured = true
        cleanup()
        const sessionId = message.params.sessionId as string
        resolve(sessionId)
      }
      browserRpc.on('Target.attachedToTarget', handleNewTarget)
      const timeoutRef = setTimeout(handleTimeout, timeout)

      const sessionId = await promise

      return sessionId
    },
    async openNewWindow(): Promise<ISimplifedWindow> {
      try {
        const electron = Electron.create({ electronApp, expect, ideVersion, page, platform, VError })
        const newWindowPromise = this.waitForNewWindow({ timeout: 20_000 })
        // Run the quickpick command to open new window
        await page.waitForIdle()
        const quickPick = QuickPick.create({
          electronApp,
          expect,
          ideVersion,
          page,
          platform,
          VError,
        })
        await quickPick.executeCommand(WellKnownCommands.NewWindow)

        const sessionId = await newWindowPromise
        if (!sessionId) {
          throw new Error(`Failed to wait for window`)
        }

        // Use electronApp.waitForPage to create the page with utility context
        const newWindowPage = await electronApp.waitForPage({
          injectUtilityScript: true,
          sessionId,
        })
        let currentNewWindowPage = newWindowPage
        const newWindowId = await electron.getNewWindowId()
        if (!newWindowId) {
          throw new Error(`Failed to determine new window id`)
        }

        await page.waitForIdle()

        return {
          async close() {
            try {
              await electron.closeWindow(newWindowId)
            } catch (error) {
              throw new VError(error, `Failed to close new window`)
            }
          },
          locator: (selector: string) => currentNewWindowPage.locator(selector),
          async openFolderFromExplorer() {
            try {
              await currentNewWindowPage.waitForIdle()
              const quickPick = QuickPick.create({
                electronApp,
                expect,
                ideVersion,
                page: currentNewWindowPage,
                platform,
                VError,
              })
              await quickPick.executeCommand(WellKnownCommands.FocusExplorer)
              await currentNewWindowPage.waitForIdle()
              const workbench = currentNewWindowPage.locator('.monaco-workbench')
              await expect(workbench).toBeVisible()
              const openFolderButton = workbench.locator('[role="button"], .monaco-button, a', {
                hasText: 'Open Folder',
              })
              const matchCount = await openFolderButton.count()
              if (matchCount === 0) {
                const candidates = workbench.locator('[role="button"], .monaco-button, a')
                const candidateCount = await candidates.count()
                const labels: string[] = []
                for (let i = 0; i < Math.min(candidateCount, 20); i++) {
                  const candidate = candidates.nth(i)
                  const text = (await candidate.textContent().catch(() => '')) || ''
                  const ariaLabel = (await candidate.getAttribute('aria-label').catch(() => '')) || ''
                  const label = `${text.trim()}|${ariaLabel.trim()}`
                  if (label !== '|') {
                    labels.push(label)
                  }
                }
                throw new Error(`Open Folder action not found. Visible action labels: ${labels.join(', ')}`)
              }
              const refreshPromise = currentNewWindowPage.waitForRefresh()
              await expect(openFolderButton.first()).toBeVisible({ timeout: 10_000 })
              await openFolderButton.first().click()
              await refreshPromise
              currentNewWindowPage = await currentNewWindowPage.refresh()
              await currentNewWindowPage.waitForIdle()
            } catch (error) {
              throw new VError(error, `Failed to open folder from explorer in new window`)
            }
          },
          sessionRpc: currentNewWindowPage.sessionRpc,
          async shouldHaveExplorerItem(direntName: string) {
            try {
              await currentNewWindowPage.waitForIdle()
              const explorer = currentNewWindowPage.locator('.explorer-folders-view .monaco-list')
              const dirent = explorer.locator('.monaco-list-row', {
                hasText: direntName,
              })
              await expect(dirent).toBeVisible({ timeout: 10_000 })
              await currentNewWindowPage.waitForIdle()
            } catch (error) {
              throw new VError(error, `Failed to verify explorer item "${direntName}" in new window`)
            }
          },
          async shouldHaveTitleContaining(value: string) {
            try {
              const start = performance.now()
              const timeout = 20_000
              while (performance.now() - start < timeout) {
                const title = (await electron.evaluate(`(() => {
  const { BrowserWindow } = globalThis._____electron
  const window = BrowserWindow.fromId(${newWindowId})
  return window && !window.isDestroyed() ? window.getTitle() : ''
})()`)) as unknown as string
                if (title.includes(value)) {
                  return
                }
                await new Promise((resolve) => setTimeout(resolve, 200))
              }
              throw new Error(`Expected window title to include ${value}`)
            } catch (error) {
              throw new VError(error, `Failed to verify new window title`)
            }
          },
          waitForIdle: () => currentNewWindowPage.waitForIdle(),
          async shouldBeVisible() {
            await currentNewWindowPage.waitForIdle()
            const workbench = currentNewWindowPage.locator('.monaco-workbench')
            await expect(workbench).toBeVisible({ timeout: 10_000 })
            await currentNewWindowPage.waitForIdle()
          },
        }
      } catch (error) {
        throw new VError(error, `Failed to open new window`)
      }
    },
    async reload({ isSsh = false } = {}): Promise<void> {
      try {
        await page.waitForIdle()

        const quickPick = dependencies.createQuickPick()

        await quickPick.executeCommand(WellKnownCommands.DeveloperReloadWindow, {
          stayVisible: true,
          pressKeyOnce: true,
          stopsApplication: true,
        })
        await page.waitForRefresh()
        const refreshedPage = await page.refresh()
        await page.rebind(refreshedPage)

        if (isSsh) {
          await page.waitForIdle()
          const statusBarItemFinished = page.locator(getSshStatusBarSelector('local-test'))
          await expect(statusBarItemFinished).toBeVisible({ timeout: 60_000 })
          await page.waitForIdle()
        }
        await this.shouldBeVisible()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to reload window`)
      }
    },
    async focusLeftEditorGroup() {
      await page.waitForIdle()
      const quickPick = QuickPick.create({
        electronApp,
        expect,
        ideVersion,
        page,
        platform,
        VError,
      })
      await quickPick.executeCommand(WellKnownCommands.ViewFocusLeftEditorGroup)
      await page.waitForIdle()
    },
    async shouldBeVisible() {
      await page.waitForIdle()
      const workbench = page.locator('.monaco-workbench')
      await expect(workbench).toBeVisible()
      await page.waitForIdle()
    },
    async shouldHaveEditorBackground(color: string) {
      try {
        const workbench = page.locator('.monaco-workbench')
        await expect(workbench).toHaveCss('--vscode-editor-background', color, {
          timeout: 1000,
        })
      } catch (error) {
        throw new VError(error, `workbench has not the expected background color`)
      }
    },
  }
}
