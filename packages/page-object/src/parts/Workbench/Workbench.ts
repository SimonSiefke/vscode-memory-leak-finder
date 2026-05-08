import type { CreateParams } from '../CreateParams/CreateParams.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export interface ISimplifedWindow {
  readonly close: () => Promise<void>
  readonly sessionRpc?: any
  readonly locator?: (selector: string) => any
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

const isReloadTransitionError = (error: unknown): boolean => {
  const message = String((error as any)?.message || error || '')
  return (
    message.includes('Execution context was destroyed') ||
    message.includes('uniqueContextId not found') ||
    message.includes('Cannot find context with specified id')
  )
}

export const create = ({ browserRpc, electronApp, expect, page, platform, reconnectDevtools, VError, ideVersion }: CreateParams) => {
  return {
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
        const newWindowPromise = this.waitForNewWindow({ timeout: 5000 })
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

        await page.waitForIdle()

        return {
          async close() {
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
              await quickPick.executeCommand(WellKnownCommands.CloseWindow)
            } catch (error) {
              throw new VError(error, `Failed to close new window`)
            }
          },
          locator: (selector: string) => newWindowPage.locator(selector),
          sessionRpc: newWindowPage.sessionRpc,
          waitForIdle: () => newWindowPage.waitForIdle(),
          async shouldBeVisible() {
            await newWindowPage.waitForIdle()
            const workbench = newWindowPage.locator('.monaco-workbench')
            await expect(workbench).toBeVisible({ timeout: 10_000 })
            await newWindowPage.waitForIdle()
          },
        }
      } catch (error) {
        throw new VError(error, `Failed to open new window`)
      }
    },
    async reload(): Promise<void> {
      try {
        await page.waitForIdle()

        const reconnectPromise = reconnectDevtools
          ? reconnectDevtools().then(
              () => true,
              () => false,
            )
          : undefined
        let reloadTriggered = false
        try {
          const commandResult = await page.evaluate({
            expression: `(() => {
  const commandId = 'workbench.action.reloadWindow'
  const candidates = [
    globalThis.workbench?.commands,
    globalThis.vscode?.commands,
    globalThis.monaco?.commands,
    globalThis.mainWindow?.commands,
  ]
  for (const commands of candidates) {
    if (commands && typeof commands.executeCommand === 'function') {
      commands.executeCommand(commandId)
      return { ok: true, strategy: 'command' }
    }
  }
  if (globalThis.location && typeof globalThis.location.reload === 'function') {
    globalThis.location.reload()
    return { ok: true, strategy: 'location' }
  }
  return { ok: false, strategy: 'none' }
})()`,
            returnByValue: true,
          })
          reloadTriggered = !!commandResult?.ok
        } catch (error) {
          if (isReloadTransitionError(error)) {
            reloadTriggered = true
          } else {
            throw error
          }
        }

        if (!reloadTriggered) {
          const quickPick = QuickPick.create({
            electronApp,
            expect,
            ideVersion,
            page,
            platform,
            VError,
          })
          try {
            await quickPick.executeCommand(WellKnownCommands.DeveloperReloadWindow)
          } catch (error) {
            if (!isReloadTransitionError(error)) {
              throw error
            }
          }
        }

        const reconnected = reconnectPromise ? await reconnectPromise : false
        if (!reconnected) {
          const refreshedPage = await page.refresh()
          await page.rebind(refreshedPage)
        }

        try {
          await page.waitForIdle()
        } catch {
          // The renderer can be in flux immediately after reload. Visibility check below is the real readiness gate.
        }
        try {
          await this.shouldBeVisible()
        } catch (error) {
          const href = await page.evaluate({
            expression: `(() => globalThis.location?.href || '')()`,
            returnByValue: true,
          })
          if (!String(href).startsWith('http://') && !String(href).startsWith('https://')) {
            throw error
          }
        }
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
      const workbench = page.locator('.monaco-workbench')
      await expect(workbench).toBeVisible()
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
