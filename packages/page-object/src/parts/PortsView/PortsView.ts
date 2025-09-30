import * as Panel from '../Panel/Panel.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export const create = ({ expect, page, VError }) => {
  return {
    async open() {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.FocusPortsView)
        await page.waitForIdle()
        const portsView = page.locator('#\\~remote\\.forwardedPortsContainer')
        await expect(portsView).toBeVisible()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to open ports view`)
      }
    },
    async close() {
      try {
        const portsView = page.locator('#\\~remote\\.forwardedPortsContainer')
        await expect(portsView).toBeVisible()
        const panel = Panel.create({ expect, page, VError })
        await panel.hide()
      } catch (error) {
        throw new VError(error, `Failed to close ports view`)
      }
    },
    async setPortInput(portId) {
      try {
        await page.waitForIdle()
        const forwardPortButton = page.locator('[role="button"]', { hasText: 'Forward a Port' })
        await expect(forwardPortButton).toBeVisible()
        await page.waitForIdle()
        await forwardPortButton.click()
        await page.waitForIdle()
        const tunnelView = page.locator('[aria-label="Tunnel View"]')
        await expect(tunnelView).toBeVisible()
        await page.waitForIdle()
        const portInput = page.locator('input[placeholder^="Port number"]')
        await expect(portInput).toBeVisible()
        await expect(portInput).toBeFocused()
        await page.waitForIdle()
        await portInput.type(`${portId}`)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to forward port ${portId}`)
      }
    },
    async cancelPortEdit() {
      try {
        await (() => {
          const { resolve, promise } = Promise.withResolvers<void>()
          setTimeout(resolve, 2100)
          return promise
        })()
        await page.waitForIdle()
        await page.keyboard.press('Escape')
        const forwardPortButton = page.locator('[role="button"]', { hasText: 'Forward a Port' })
        await expect(forwardPortButton).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to cancel port edit`)
      }
    },
  }
}
