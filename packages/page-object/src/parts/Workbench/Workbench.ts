import type { CreateParams } from '../CreateParams/CreateParams.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

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
  select: (text: string | RegExp, stayVisible?: boolean | 'dont-care') => Promise<number>
  showCommands: (options?: { pressKeyOnce?: boolean }) => Promise<void>
  type: (value: string) => Promise<void>
}

type WorkbenchDependencies = {
  readonly createQuickPick: () => QuickPickApi
  readonly sleep: (milliseconds: number) => Promise<void>
}

export interface ISimplifedWindow {
  readonly evaluate: (options: { expression: string; awaitPromise?: boolean }) => Promise<any>
  readonly close: () => Promise<void>
  readonly closeGracefully: () => Promise<void>
  readonly locator?: (selector: string) => any
  readonly sessionRpc?: any
  readonly shouldBeVisible: () => Promise<void>
  readonly waitForIdle: () => Promise<void>
  readonly Workbench?: any
}

const createLocatorProxy = (sessionRpc: any, selector: string, sessionId?: string) => {
  return {
    hasText: undefined,
    locator(subSelector: string) {
      return createLocatorProxy(sessionRpc, `${selector} ${subSelector}`, sessionId)
    },
    objectType: 'locator',
    rpc: sessionRpc,
    selector,
    sessionId,
    sessionRpc,
  }
}

const isReloadTransitionError = (error: unknown): boolean => {
  const message = String((error as any)?.message || error || '')
  return (
    message.includes('Execution context was destroyed') ||
    message.includes('uniqueContextId not found') ||
    message.includes('Cannot find context with specified id') ||
    message.includes('Inspected target navigated or closed')
  )
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

const sleep = async (milliseconds: number): Promise<void> => {
  const { promise, resolve } = Promise.withResolvers<void>()
  setTimeout(resolve, milliseconds)
  await promise
}

const getRemoteHostPlatformLabel = (platform: string): string => {
  switch (platform) {
    case 'darwin':
      return 'macOS'
    case 'linux':
      return 'Linux'
    case 'win32':
      return 'Windows'
    default:
      throw new Error(`Unsupported platform for Remote - SSH host selection: ${platform}`)
  }
}

const maybeSelectRemoteHostPlatform = async (
  quickPick: QuickPickApi,
  dependencies: WorkbenchDependencies,
  platform: string,
): Promise<void> => {
  const expectedPlatform = getRemoteHostPlatformLabel(platform)
  const platformOptions = ['Linux', 'Windows', 'macOS']
  const start = Date.now()
  while (Date.now() - start < 5000) {
    try {
      const visibleCommands = await quickPick.getVisibleCommands()
      if (visibleCommands.includes(expectedPlatform)) {
        await quickPick.select(expectedPlatform)
        return
      }
      if (visibleCommands.some((item) => platformOptions.includes(item))) {
        throw new Error(
          `Remote - SSH asked for the remote host platform, but the expected option "${expectedPlatform}" was not available. Visible options: ${visibleCommands.join(', ')}`,
        )
      }
    } catch (error) {
      const message = String((error as any)?.message || error || '')
      if (!message.includes('Failed to get visible commands')) {
        throw error
      }
    }
    await dependencies.sleep(250)
  }
}

const waitForSshConnection = async (
  {
    page,
    reconnectDevtools,
  }: {
    page: any
    reconnectDevtools: (() => Promise<void>) | undefined
  },
  dependencies: WorkbenchDependencies,
) => {
  const reconnectPromise = reconnectDevtools
    ? reconnectDevtools().then(
        () => true,
        () => false,
      )
    : undefined

  const reconnected = reconnectPromise ? await reconnectPromise : false
  let recoveredFromTransitionError = false

  if (!reconnected) {
    const refreshedPage = await page.refresh()
    await page.rebind(refreshedPage)
  }

  const start = Date.now()
  while (Date.now() - start < 30_000) {
    try {
      await page.waitForIdle()
      return
    } catch (error) {
      if (!recoveredFromTransitionError && isReloadTransitionError(error)) {
        const refreshedPage = await page.refresh()
        await page.rebind(refreshedPage)
        recoveredFromTransitionError = true
        continue
      }
    }
    await dependencies.sleep(250)
  }
  throw new Error(`Timed out waiting for Remote - SSH connection to settle`)
}

export const create = ({
  browserRpc,
  createPageObject,
  electronApp,
  expect,
  ideVersion,
  page,
  platform,
  reconnectDevtools,
  VError,
}: CreateParams) => {
  const workbenchContext = {
    browserRpc,
    electronApp,
    expect,
    ideVersion,
    page,
    platform,
    VError,
    ...(createPageObject && { createPageObject }),
    ...(reconnectDevtools && { reconnectDevtools }),
  }
  return createWithDependencies(workbenchContext, {
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
  })
}

export const createWithDependencies = (
  { browserRpc, createPageObject, electronApp, expect, ideVersion, page, platform, reconnectDevtools, VError }: CreateParams,
  dependencies: WorkbenchDependencies,
) => {
  return {
    async connectToSsh(options: ConnectToSshOptions): Promise<void> {
      try {
        const target = resolveSshTarget(options)
        const quickPick = dependencies.createQuickPick()
        await page.waitForIdle()
        await quickPick.showCommands({ pressKeyOnce: true })
        await quickPick.type(WellKnownCommands.RemoteSshConnectCurrentWindowToHost)
        await quickPick.pressEnter()
        await quickPick.type(target)
        await page.waitForIdle()
        await quickPick.pressEnter()
        await maybeSelectRemoteHostPlatform(quickPick, dependencies, platform)
        await waitForSshConnection({ page, reconnectDevtools }, dependencies)
      } catch (error) {
        const message =
          options.alias || options.port ? `Failed to connect to SSH server` : `Failed to connect to SSH server: missing target`
        throw new VError(error, message)
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
    async openChatWindow(): Promise<ISimplifedWindow> {
      return this.openNewWindow('Agents: Open Chat in New Window')
    },
    async openNewWindow(command: string = WellKnownCommands.NewWindow): Promise<ISimplifedWindow> {
      try {
        // Resume and attach a new auxiliary target while its opener is still waiting.
        const newWindowPromise = this.waitForNewWindowReady(30_000)
        void newWindowPromise.catch(() => {})
        await dependencies.createQuickPick().executeCommand(command)
        return await newWindowPromise
      } catch (error) {
        throw new VError(error, 'Failed to open new window')
      }
    },
    async waitForNewWindowReady(timeout = 30_000, url?: string): Promise<ISimplifedWindow> {
      const sessionId = await this.waitForNewWindow({ timeout, ...(url ? { url } : {}) })
      if (!sessionId) throw new Error('No new window target attached')
      return this.connectWindow(sessionId)
    },
    async connectWindow(sessionId: string): Promise<ISimplifedWindow> {
      const newWindowPage = await electronApp.waitForPage({ injectUtilityScript: true, sessionId })
      const newWindow = createPageObject ? await createPageObject(newWindowPage) : Object.create(null)
      const getNewWindowPage = () => newWindow.__page || newWindowPage

      return Object.assign(newWindow, {
        async close() {
          try {
            // Wait for the window to be fully idle before attempting to close
            const page = getNewWindowPage()
            await page.waitForIdle()
            await page.close()
          } catch (error) {
            throw new VError(error, `Failed to close new window`)
          }
        },
        async closeGracefully() {
          try {
            // Wait for the window to be fully idle before attempting to close
            await newWindowPage.waitForIdle()
            const quickPick = QuickPick.create({
              electronApp,
              expect,
              ideVersion,
              page: newWindowPage,
              platform,
              VError,
            })
            await quickPick.executeCommand(WellKnownCommands.CloseWindow, { stopsApplication: true })
          } catch (error) {
            throw new VError(error, `Failed to close new window`)
          }
        },
        locator: (selector: string) => getNewWindowPage().locator(selector),
        evaluate(options: { readonly awaitPromise?: boolean; readonly expression: string; readonly replMode?: boolean }) {
          const page = getNewWindowPage()
          return page.evaluateInMainWorld(options)
        },
        sessionRpc: newWindowPage.sessionRpc,
        async shouldBeVisible() {
          const page = getNewWindowPage()
          await page.waitForIdle()
          const workbench = page.locator('.monaco-workbench')
          await expect(workbench).toBeVisible({ timeout: 20_000 })
          await page.waitForIdle()
        },
        waitForIdle: () => getNewWindowPage().waitForIdle(),
      })
    },
    async reload(): Promise<void> {
      let timer: ReturnType<typeof setTimeout> | undefined
      let onCleared: ((message: any) => void) | undefined
      try {
        await page.waitForIdle()
        await page.sessionRpc.invoke('Runtime.enable', {})
        const sessionId = page.sessionRpc.sessionId
        const navigation = new Promise<void>((resolve, reject) => {
          onCleared = (message) => {
            if (!sessionId || message?.sessionId === sessionId) resolve()
          }
          page.sessionRpc.on('Runtime.executionContextsCleared', onCleared)
          timer = setTimeout(() => reject(new Error('Reload did not clear the renderer context')), 15_000)
        })
        void navigation.catch(() => {})
        await dependencies.createQuickPick().executeCommand(WellKnownCommands.DeveloperReloadWindow, {
          stopsApplication: true,
          stayVisible: 'dont-care',
        })
        await navigation
        const deadline = Date.now() + 30_000
        while (true) {
          try {
            await page.rebind(await page.refresh())
            await this.shouldBeVisible()
            return
          } catch (error) {
            if (!isReloadTransitionError(error) || Date.now() >= deadline) throw error
            await dependencies.sleep(100)
          }
        }
      } catch (error) {
        throw new VError(error, 'Failed to reload window')
      } finally {
        clearTimeout(timer)
        if (onCleared) page.sessionRpc.off('Runtime.executionContextsCleared', onCleared)
      }
    },
    evaluate(options: { readonly awaitPromise?: boolean; readonly expression: string; readonly replMode?: boolean }) {
      return page.evaluateInMainWorld(options)
    },
    async collectGarbage(): Promise<void> {
      await page.rpc.invoke('HeapProfiler.collectGarbage')
    },
    async shouldBeVisible() {
      const workbench = page.locator('.monaco-workbench')
      await expect(workbench).toBeVisible()
    },
    async shouldHaveEditorBackground(color: string | readonly string[]) {
      try {
        const workbench = page.locator('.monaco-workbench')
        const expectedColor = Array.isArray(color) ? new RegExp(`^(${color.map(escapeRegExp).join('|')})$`) : color
        await expect(workbench).toHaveCss('--vscode-editor-background', expectedColor, {
          timeout: 1000,
        })
      } catch (error) {
        throw new VError(error, `workbench has not the expected background color`)
      }
    },
    async waitForNewWindow({ timeout, url }: { timeout: number; url?: string }) {
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
        // Electron auxiliary windows initially attach with an empty URL before about:blank.
        if (
          targetCaptured ||
          (url && message.params.targetInfo.url !== url && !(url === 'about:blank' && !message.params.targetInfo.url))
        ) {
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
  }
}
