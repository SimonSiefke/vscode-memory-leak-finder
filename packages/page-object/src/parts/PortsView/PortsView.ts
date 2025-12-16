import * as Panel from '../Panel/Panel.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'
import * as Server from '../Server/Server.ts'

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
        await page.waitForIdle()
        const portsView = page.locator('#\\~remote\\.forwardedPortsContainer')
        await expect(portsView).toBeVisible()
        const panel = Panel.create({ expect, page, VError })
        await panel.hide()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to close ports view`)
      }
    },
    async setPortInput(portId) {
      try {
        await page.waitForIdle()
        await new Promise((r) => {})
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
        await page.waitForIdle()
        await page.keyboard.press('Escape')
        await page.waitForIdle()
        const forwardPortButton = page.locator('[role="button"]', { hasText: 'Forward a Port' })
        await expect(forwardPortButton).toBeVisible()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to cancel port edit`)
      }
    },
    async forwardPort(port: number): Promise<{
      [Symbol.asyncDispose]: () => Promise<void>
    }> {
      try {
        const server = Server.create({ VError })
        const serverInfo = await server.start({
          port,
          requestHandler(req, res) {
            res.end('Hello World')
          },
        })
        const quickPick = QuickPick.create({ page, expect, VError })
        await quickPick.executeCommand(WellKnownCommands.ForwardAPort, {
          pressKeyOnce: true,
          stayVisible: true,
        })
        await page.waitForIdle()
        await quickPick.type(`${port}`)
        await page.waitForIdle()
        await quickPick.pressEnter()
        await page.waitForIdle()
        const tunnelView = page.locator('[aria-label="Tunnel View"]')
        await expect(tunnelView).toBeVisible({
          timeout: 120_000,
        })
        const portRow = tunnelView.locator(`.monaco-list-row[aria-label^="Remote port localhost:${port} forwarded"]`)
        await expect(portRow).toBeVisible()
        await page.waitForIdle()
        // TODO dispose server?
        return {
          async [Symbol.asyncDispose]() {
            await serverInfo.dispose()
          },
        }
      } catch (error) {
        throw new VError(error, `Failed to forward port ${port}`)
      }
    },
    async shouldHaveForwardedPort(portId: number): Promise<void> {
      try {
        await page.waitForIdle()
        const portsView = page.locator('#\\~remote\\.forwardedPortsContainer')
        const portItem = portsView.locator(`[aria-label*="${portId}"], .monaco-list-row:has-text("${portId}")`).first()
        await expect(portItem).toBeVisible({ timeout: 10_000 })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to verify port ${portId} is forwarded`)
      }
    },
    async unforwardAllPorts(port: number): Promise<void> {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ page, expect, VError })
        await quickPick.executeCommand(WellKnownCommands.StopPortForwarding, {
          pressKeyOnce: true,
          stayVisible: true,
        })
        await page.waitForIdle()
        await quickPick.select(`${port}`)
        await page.waitForIdle()
        const tunnelView = page.locator('[aria-label="Tunnel View"]')
        await expect(tunnelView).toBeHidden()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed unforward all ports`)
      }
    },
  }
}
