import { createServer } from 'node:http'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WebView from '../WebView/WebView.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

interface MockServer {
  [Symbol.asyncDispose]: () => Promise<void>
}

const createMockServer = async ({ port }): Promise<MockServer> => {
  const server = createServer((req, res) => {
    if (req.url === '/page-b') {
      res.statusCode = 200
      res.setHeader('Content-Type', 'text/html')
      res.end('<html><head><title>Page B</title></head><body><h1>Page B</h1></body></html>')
    } else {
      res.statusCode = 200
      res.setHeader('Content-Type', 'text/html')
      res.end('<html><head><title>Page A</title></head><body><h1>Page A</h1><a href="/page-b">Go to Page B</a></body></html>')
    }
  })
  const { promise, resolve } = Promise.withResolvers()
  server.once('listening', resolve)
  server.listen(port)
  await promise
  return {
    async [Symbol.asyncDispose]() {
      const { promise, resolve } = Promise.withResolvers()
      server.close(resolve)
      await promise
    },
  }
}

import * as CreateParams from '../CreateParams/CreateParams.ts'

export const create = ({ expect, page, platform, VError }: CreateParams.CreateParams) => {
  return {
    async addElementToChat({ selector }) {
      try {
        await page.waitForIdle()
        const add = page.locator('.element-selection-message')
        await expect(add).toBeVisible()
        const button = add.locator('[role="button"][aria-label="Click to select an element."]')
        await expect(button).toBeVisible()
        await button.click()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to add element to chat`)
      }
    },
    async clickLink({ href }) {
      try {
        await page.waitForIdle()
        const webView = WebView.create({ electronApp: undefined, expect, ideVersion: { major: 0, minor: 0, patch: 0 }, page, platform: undefined, VError })
        const subFrame = await webView.shouldBeVisible2({
          extensionId: 'vscode.simple-browser',
          hasLineOfCodeCounter: false,
        })
        await subFrame.waitForIdle()
        await page.waitForIdle()
        const subIframe = subFrame.locator('.content iframe')
        await expect(subIframe).toBeVisible()
        await page.waitForIdle()
        const innerFrame = await subFrame.waitForSubIframe({
          injectUtilityScript: false,
          url: /http:\/\/localhost/,
        })
        await innerFrame.waitForIdle()
        const link = innerFrame.locator(`a[href="${href}"]`)
        await expect(link).toBeVisible()
        await link.click()
        await innerFrame.waitForIdle()
        await page.waitForIdle()
        // Wait for navigation to complete
        await subFrame.waitForSubIframe({
          injectUtilityScript: false,
          url: new RegExp(href),
        })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to click link ${href}`)
      }
    },
    async createMockServer({ id, port }) {
      try {
        await page.waitForIdle()
        const server = await createMockServer({ port })
        this.mockServers[id] = server
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to create mock server`)
      }
    },
    async disposeMockServer({ id }) {
      try {
        const server = this.mockServers[id]
        await server[Symbol.asyncDispose]()
        delete this.mockServers[id]
      } catch (error) {
        throw new VError(error, `Failed to dispose mock server`)
      }
    },
    async mockElectronDebugger({ selector }) {
      try {
        await page.waitForIdle()
        const add = page.locator('.element-selection-message')
        await expect(add).toBeVisible()
        const button = add.locator('[role="button"][aria-label="Click to select an element."]')
        await expect(button).toBeVisible()
        await button.click()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to add element to chat`)
      }
    },
    mockServers: Object.create(null),
    async shouldHaveTabTitle({ title }) {
      try {
        await page.waitForIdle()
        const tab = page.locator('.tab', { hasText: `Simple Browser` })
        await expect(tab).toBeVisible()
        await page.waitForIdle()
        // Check both tab-label text and aria-label
        // The title might be "Simple Browser: Page B" or just "Page B"
        const tabLabel = tab.locator('.tab-label')
        const titleRegex = new RegExp(title)
        try {
          await expect(tabLabel).toHaveText(titleRegex, { timeout: 5000 })
        } catch {
          // If text doesn't match, try aria-label
          await expect(tab).toHaveAttribute('aria-label', titleRegex, { timeout: 5000 })
        }
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to verify tab title ${title}`)
      }
    },
    async show({ port }) {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ electronApp: undefined, expect, ideVersion: { major: 0, minor: 0, patch: 0 }, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.SimpleBrowserShow, {
          pressKeyOnce: true,
          stayVisible: true,
        })
        await page.waitForIdle()
        const message = page.locator('#quickInput_message')
        await expect(message).toBeVisible()
        await page.waitForIdle()
        await expect(message).toHaveText(`Enter url to visit (Press 'Enter' to confirm or 'Escape' to cancel)`)
        await page.waitForIdle()
        await quickPick.type(`http://localhost:${port}`)
        await page.waitForIdle()
        await quickPick.pressEnter()
        await page.waitForIdle()

        const tab = page.locator('.tab', { hasText: `Simple Browser` })
        await expect(tab).toBeVisible()
        await page.waitForIdle()
        await expect(tab).toHaveCount(1)
        await page.waitForIdle()

        const webView = WebView.create({ electronApp: undefined, expect, ideVersion: { major: 0, minor: 0, patch: 0 }, page, platform: undefined, VError })
        const subFrame = await webView.shouldBeVisible2({
          extensionId: 'vscode.simple-browser',
          hasLineOfCodeCounter: false,
        })
        await subFrame.waitForIdle()
        await page.waitForIdle()
        const nav = subFrame.locator('nav.controls')
        await expect(nav).toBeVisible()
        await subFrame.waitForIdle()
        const urlInput = subFrame.locator('.url-input')
        await expect(urlInput).toBeVisible()
        await subFrame.waitForIdle()
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
