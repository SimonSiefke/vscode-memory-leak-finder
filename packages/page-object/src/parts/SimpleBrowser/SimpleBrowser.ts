import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as Root from '../Root/Root.ts'
import * as WebView from '../WebView/WebView.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

interface MockServer {
  [Symbol.asyncDispose]: () => Promise<void>
}

const workspacePath = join(Root.root, '.vscode-test-workspace')

const escapeRegExp = (value: string): string => {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const getContentType = (filePath: string): string => {
  switch (extname(filePath)) {
    case '.css':
      return 'text/css; charset=utf-8'
    case '.html':
      return 'text/html; charset=utf-8'
    case '.js':
      return 'text/javascript; charset=utf-8'
    case '.json':
      return 'application/json; charset=utf-8'
    case '.svg':
      return 'image/svg+xml; charset=utf-8'
    case '.txt':
      return 'text/plain; charset=utf-8'
    default:
      return 'application/octet-stream'
  }
}

const createMockServer = async ({ port }: { port: number }): Promise<MockServer> => {
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

const createWorkspaceFileServer = async ({ port, relativePath }: { port: number; relativePath: string }): Promise<MockServer> => {
  const absolutePath = join(workspacePath, relativePath)
  const server = createServer(async (_req, res) => {
    try {
      const content = await readFile(absolutePath)
      res.statusCode = 200
      res.setHeader('Content-Type', getContentType(absolutePath))
      res.end(content)
    } catch {
      res.statusCode = 404
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      res.end(`File not found: ${relativePath}`)
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

import type { CreateParams } from '../CreateParams/CreateParams.ts'

export const create = ({ electronApp, expect, ideVersion, page, platform, VError }: CreateParams) => {
  const getUrl = ({ path = '', port, url }: { path?: string; port: number | undefined; url: string | undefined }): string => {
    if (url) {
      return url
    }
    if (typeof port !== 'number') {
      throw new Error(`port or url is required`)
    }
    return `http://localhost:${port}${path}`
  }

  const getBrowserUrlInput = () => {
    return page.locator('.browser-url-input')
  }

  const getBrowserNavigationButton = async ({ names }: { names: readonly string[] }) => {
    for (const name of names) {
      const button = page.getByRole('button', { name: new RegExp(`^${escapeRegExp(name)}$`, 'i') }).first()
      if (await button.isVisible().catch(() => false)) {
        return button
      }
    }
    for (const name of names) {
      const button = page.locator(`[aria-label="${name}"], [title="${name}"]`).first()
      if (await button.isVisible().catch(() => false)) {
        return button
      }
    }
    throw new Error(`Browser navigation button not found: ${names.join(', ')}`)
  }

  const openIntegratedBrowser = async () => {
    const quickPick = QuickPick.create({ electronApp, expect, ideVersion, page, platform, VError })

    try {
      await quickPick.executeCommand(WellKnownCommands.ClearAllNotifications, {
        pressKeyOnce: true,
      })
      await page.waitForIdle()
    } catch {
      // Notifications are not always present, and failing to clear them should not block browser tests.
    }
    await quickPick.executeCommand(WellKnownCommands.OpenIntegratedBrower, {
      pressKeyOnce: true,
    })
    await page.waitForIdle()
    const urlInput = getBrowserUrlInput()
    await expect(urlInput).toBeVisible()
    await page.waitForIdle()
    return urlInput
  }

  const navigateIntegratedBrowser = async ({ url, waitForContentFrame }: { url: string; waitForContentFrame: boolean }) => {
    const urlInput = getBrowserUrlInput()
    await expect(urlInput).toBeVisible()
    await urlInput.fill('')
    await page.waitForIdle()
    await urlInput.type(url)
    await page.waitForIdle()
    await urlInput.press('Enter')
    await page.waitForIdle()
    if (waitForContentFrame) {
      await getContentFrame({
        urlPattern: new RegExp(escapeRegExp(url)),
      })
    }
  }

  const getContentFrame = async ({ urlPattern = /http:\/\/localhost/ }: { urlPattern?: RegExp } = {}) => {
    const webView = WebView.create({ electronApp, expect, ideVersion, page, platform, VError })
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
      url: urlPattern,
    })
    await innerFrame.waitForIdle()
    return innerFrame
  }

  return {
    async addElementToChat({ selector }: { selector: string }) {
      try {
        await page.waitForIdle()
        const add = page.locator('.element-selection-message')
        await expect(add).toBeVisible()
        const button = add.locator('[role="button"][aria-label="Click to select an element."]')
        await expect(button).toBeVisible()
        await button.click()
        await page.waitForIdle()
        const innerFrame = await getContentFrame({
          urlPattern: /^https?:\/\//,
        })
        const element = innerFrame.locator(selector)
        await expect(element).toBeVisible()
        await element.click()
        await innerFrame.waitForIdle()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to add element to chat`)
      }
    },
    async clickLink({ href }: { href: string }) {
      try {
        await page.waitForIdle()
        const innerFrame = await getContentFrame()
        await innerFrame.waitForIdle()
        const link = innerFrame.locator(`a[href="${href}"]`)
        await expect(link).toBeVisible()
        await link.click()
        await innerFrame.waitForIdle()
        await page.waitForIdle()
        await getContentFrame({
          urlPattern: new RegExp(escapeRegExp(href)),
        })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to click link ${href}`)
      }
    },
    async back({ urlPattern = /http:\/\/localhost/ }: { urlPattern?: RegExp } = {}) {
      try {
        await page.waitForIdle()
        const button = await getBrowserNavigationButton({
          names: ['Go Back', 'Back', 'Navigate Back'],
        })
        await expect(button).toBeVisible()
        await button.click()
        await page.waitForIdle()
        await getContentFrame({ urlPattern })
      } catch (error) {
        throw new VError(error, `Failed to navigate simple browser back`)
      }
    },
    async createMockServer({ id, port }: { id: string; port: number }) {
      try {
        await page.waitForIdle()
        const server = await createMockServer({ port })
        this.mockServers[id] = server
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to create mock server`)
      }
    },
    async createWorkspaceFileServer({ id, port, relativePath }: { id: string; port: number; relativePath: string }) {
      try {
        await page.waitForIdle()
        const server = await createWorkspaceFileServer({ port, relativePath })
        this.mockServers[id] = server
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to create workspace file server`)
      }
    },
    async disposeMockServer({ id }: { id: string }) {
      try {
        const server = this.mockServers[id]
        await server[Symbol.asyncDispose]()
        delete this.mockServers[id]
      } catch (error) {
        throw new VError(error, `Failed to dispose mock server`)
      }
    },
    async mockElectronDebugger({ selector: _selector }: { selector: string }) {
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
    async forward({ urlPattern = /http:\/\/localhost/ }: { urlPattern?: RegExp } = {}) {
      try {
        await page.waitForIdle()
        const button = await getBrowserNavigationButton({
          names: ['Go Forward', 'Forward', 'Navigate Forward'],
        })
        await expect(button).toBeVisible()
        await button.click()
        await page.waitForIdle()
        await getContentFrame({ urlPattern })
      } catch (error) {
        throw new VError(error, `Failed to navigate simple browser forward`)
      }
    },
    async reload({ urlPattern = /http:\/\/localhost/ }: { urlPattern?: RegExp } = {}) {
      try {
        await page.waitForIdle()
        const innerFrame = await getContentFrame({ urlPattern })
        await innerFrame.reload()
        await innerFrame.waitForIdle()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to reload simple browser`)
      }
    },
    async shouldHaveText({
      selector = 'body',
      text,
      urlPattern = /http:\/\/localhost/,
    }: {
      selector?: string
      text: string
      urlPattern?: RegExp
    }) {
      try {
        await page.waitForIdle()
        const innerFrame = await getContentFrame({ urlPattern })
        const locator = innerFrame.locator(selector)
        await expect(locator).toContainText(text)
        await innerFrame.waitForIdle()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to verify simple browser text ${text}`)
      }
    },
    async shouldHaveTabTitle({ title }: { title: string }) {
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
    async shouldHaveElementScreenshotInChat() {
      try {
        await page.waitForIdle()
        const attachedContext = page.locator('.chat-attached-context')
        await expect(attachedContext.first()).toBeVisible({ timeout: 15_000 })
        await page.waitForIdle()
        const preview = attachedContext.locator('img, canvas, [aria-label*=".png"], [aria-label*="image" i]')
        await expect(preview.first()).toBeVisible({ timeout: 15_000 })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to verify element screenshot in chat`)
      }
    },
    async showLegacy({ url }: { url: string }) {
      const quickPick = QuickPick.create({ electronApp, expect, ideVersion, page, platform, VError })

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
      await quickPick.type(url)
      await page.waitForIdle()
      await quickPick.pressEnter()
      await page.waitForIdle()

      const tab = page.locator('.tab', { hasText: `Simple Browser` })
      await expect(tab).toBeVisible()
      await page.waitForIdle()
      await expect(tab).toHaveCount(1)
      await page.waitForIdle()
      await getContentFrame({
        urlPattern: new RegExp(escapeRegExp(url)),
      })
    },
    async showModern({ url }: { url: string }) {
      await openIntegratedBrowser()
      await navigateIntegratedBrowser({
        url,
        waitForContentFrame: true,
      })
    },
    async showLoadError({ url }: { url: string }) {
      try {
        if (ideVersion.minor < 113) {
          throw new Error('Integrated browser is not available in this IDE version')
        }
        await openIntegratedBrowser()
        await navigateIntegratedBrowser({
          url,
          waitForContentFrame: false,
        })
      } catch (error) {
        throw new VError(error, `Failed to open simple browser load error page`)
      }
    },
    async show({ path = '', port, url }: { path?: string; port?: number; url?: string }) {
      try {
        const browserUrl = getUrl({ path, port, url })
        if (ideVersion.minor >= 113) {
          await this.showModern({ url: browserUrl })
        } else {
          await this.showLegacy({ url: browserUrl })
        }
      } catch (error) {
        throw new VError(error, `Failed to open simple browser`)
      }
    },
    async shouldHaveLoadError({ title, text }: { title: string; text: string }) {
      try {
        await page.waitForIdle()
        const errorTitle = page.locator('.browser-error-title')
        await expect(errorTitle).toBeVisible()
        await expect(errorTitle).toContainText(new RegExp(escapeRegExp(title), 'i'))
        const errorDetail = page.locator('.browser-error-detail')
        await expect(errorDetail).toBeVisible()
        await expect(errorDetail).toContainText(new RegExp(escapeRegExp(text), 'i'))
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to verify simple browser load error ${title}: ${text}`)
      }
    },
  }
}
