import { createServer } from 'node:http'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'
import * as WebView from '../WebView/WebView.ts'

export const create = ({ page, expect, VError, ideVersion }) => {
  return {
    async show({ port }) {
      try {
        const server = createServer((req, res) => {
          res.statusCode = 200
          res.end('<h1>hello world</h1>')
        })
        const { resolve, promise } = Promise.withResolvers()
        server.once('listening', resolve)
        server.listen(port)
        await promise

        const quickPick = QuickPick.create({ page, expect, VError })
        await quickPick.executeCommand(WellKnownCommands.SimpleBrowserShow, {
          pressKeyOnce: true,
          stayVisible: true,
        })
        await page.waitForIdle()
        const message = page.locator('#quickInput_message')
        await expect(message).toBeVisible()
        await expect(message).toHaveText(`Enter url to visit (Press 'Enter' to confirm or 'Escape' to cancel)`)
        await page.waitForIdle()
        await quickPick.type(`http://localhost:${port}`)
        await page.waitForIdle()
        await quickPick.pressEnter()
        await page.waitForIdle()

        const tab = page.locator('.tab', { hasText: `Simple Browser` })
        await expect(tab).toBeVisible()
        await expect(tab).toHaveCount(1)
        await page.waitForIdle()

        const webView = WebView.create({ page, expect, VError })
        const subFrame = await webView.shouldBeVisible2({
          extensionId: 'vscode.simple-browser',
          hasLineOfCodeCounter: false,
        })
        await subFrame.waitForIdle()
        const nav = subFrame.locator('nav.controls')
        await expect(nav).toBeVisible()
        const urlInput = subFrame.locator('.url-input')
        await expect(urlInput).toBeVisible()
        await page.waitForIdle()
        const subIframe = subFrame.locator('.content iframe')
        await expect(subIframe).toBeVisible()
        await page.waitForIdle()

        // TODO check that inner iframe (x3) has expected content
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to open simple browser`)
      }
    },
  }
}
