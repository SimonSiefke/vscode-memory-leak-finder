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

const rejectaftertimeout = () => {
  const { promise, reject } = Promise.withResolvers<never>()
  setTimeout(() => reject(new Error('Timeout waiting for new window')), 5000)
  return promise
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

export const create = ({ browserRpc, electronApp, expect, page, platform, VError, ideVersion }: CreateParams) => {
  return {
    async waitForNewWindow() {
      const { promise, resolve } = Promise.withResolvers<string>()
      let targetCaptured = false

      // TODO cleanup listener

      if (!browserRpc) {
        throw new Error(`browser rpc is required`)
      }

      const handleNewTarget = (message: any): void => {
        if (targetCaptured) {
          return
        }
        targetCaptured = true
        const sessionId = message.params.sessionId as string
        resolve(sessionId)
      }
      browserRpc.on('Target.attachedToTarget', handleNewTarget)

      const sessionId = await promise

      return sessionId
    },
    async openNewWindow(): Promise<ISimplifedWindow> {
      try {
        const newWindowPromise = this.waitForNewWindow()
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

        const sessionId = await Promise.race([newWindowPromise, rejectaftertimeout()])
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
    async focusLeftEditorGroup() {
      await page.waitForIdle()
      const quickPick = QuickPick.create({
        electronApp: undefined,
        expect,
        ideVersion: { major: 0, minor: 0, patch: 0 },
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
