import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
import * as Electron from '../Electron/Electron.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as Root from '../Root/Root.ts'
import * as WebView from '../WebView/WebView.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

interface MockServer {
  [Symbol.asyncDispose]: () => Promise<void>
}

interface DeferredMockServer extends MockServer {
  finishResponse: () => void
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

const createDeferredMockServer = async ({ port }: { port: number }): Promise<DeferredMockServer> => {
  const response = Promise.withResolvers<void>()
  const server = createServer(async (req, res) => {
    if (req.url === '/page-b') {
      res.statusCode = 200
      res.setHeader('Content-Type', 'text/html')
      res.end('<html><head><title>Page B</title></head><body><h1>Page B</h1></body></html>')
      return
    }
    await response.promise
    res.statusCode = 200
    res.setHeader('Content-Type', 'text/html')
    res.end('<html><head><title>Page A</title></head><body><h1>Page A</h1><a href="/page-b">Go to Page B</a></body></html>')
  })
  const { promise, resolve } = Promise.withResolvers<void>()
  server.once('listening', resolve)
  server.listen(port)
  await promise
  return {
    finishResponse() {
      response.resolve()
    },
    async [Symbol.asyncDispose]() {
      const { promise, resolve } = Promise.withResolvers<void>()
      server.close(() => {
        resolve()
      })
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
  const api = {
    mockServers: Object.create(null) as Record<string, MockServer>,
    getUrl({ path = '', port, url }: { path?: string; port: number | undefined; url: string | undefined }): string {
      if (url) {
        return url
      }
      if (typeof port !== 'number') {
        throw new Error(`port or url is required`)
      }
      return `http://localhost:${port}${path}`
    },
    getBrowserUrlInput() {
      return page.locator('.browser-url-input')
    },
    getBrowserFindWidget() {
      return page.locator('.browser-find-widget-wrapper .find-widget')
    },
    getSimpleBrowserTab() {
      return page.locator('.tab', { hasText: 'Simple Browser' }).first()
    },
    getElectron() {
      return Electron.create({ electronApp, expect, ideVersion, page, platform, VError })
    },
    async waitForCondition({ condition, timeout = 10_000 }: { condition: () => Promise<boolean>; timeout?: number }): Promise<void> {
      const start = Date.now()
      while (Date.now() - start < timeout) {
        if (await condition()) {
          return
        }
        await new Promise((resolve) => {
          setTimeout(resolve, 100)
        })
      }
      throw new Error('Timed out waiting for condition')
    },
    async isSimpleBrowserTabLoading(): Promise<boolean> {
      const tab = this.getSimpleBrowserTab()
      if (!(await tab.isVisible().catch(() => false))) {
        return false
      }
      const className = (await tab.getAttribute('class')) || ''
      if (/\bloading\b|\bbusy\b/.test(className)) {
        return true
      }
      const ariaLabel = (await tab.getAttribute('aria-label')) || ''
      if (/loading/i.test(ariaLabel)) {
        return true
      }
      const spinner = tab.locator(
        '.codicon-loading, .codicon[class*="spin"], .codicon[class*="loading"], .tab-actions [class*="loading"], .monaco-progress-container',
      )
      return spinner
        .first()
        .isVisible()
        .catch(() => false)
    },
    async getBrowserNavigationButton({ names }: { names: readonly string[] }) {
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
    },
    async openIntegratedBrowser() {
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
      const urlInput = this.getBrowserUrlInput()
      await expect(urlInput).toBeVisible()
      await page.waitForIdle()
      return urlInput
    },
    async navigateIntegratedBrowser({ url, waitForContentFrame }: { url: string; waitForContentFrame: boolean }) {
      const urlInput = this.getBrowserUrlInput()
      await expect(urlInput).toBeVisible()
      await urlInput.fill('')
      await page.waitForIdle()
      await urlInput.type(url)
      await page.waitForIdle()
      await urlInput.press('Enter')
      await page.waitForIdle()
      if (waitForContentFrame) {
        if (ideVersion.minor >= 118) {
          await this.waitForContentFrameModern({
            urlPattern: new RegExp(escapeRegExp(url)),
          })
        } else {
          await this.getContentFrame({
            urlPattern: new RegExp(escapeRegExp(url)),
          })
        }
      }
    },
    async waitForContentFrameModern({ urlPattern = /http:\/\/localhost/ }: { urlPattern?: RegExp } = {}) {
      const electron = this.getElectron()
      await electron.waitForWebContentsView({
        urlPattern,
      })
      await page.waitForIdle()
    },
    async activateModernBrowserEditor() {
      const electron = this.getElectron()
      const entry = await electron.waitForWebContentsView({
        urlPattern: /^https?:\/\//,
      })
      const candidates = []
      if (entry.title) {
        candidates.push(page.locator('.tab', { hasText: entry.title }).first())
        candidates.push(page.locator(`[role="tab"][data-resource-name="${entry.title}"]`).first())
      }
      candidates.push(this.getSimpleBrowserTab())
      if (await this.tryClickFirstVisible(candidates)) {
        await page.waitForIdle()
      }
    },
    async getContentFrameLegacy({ urlPattern = /http:\/\/localhost/ }: { urlPattern?: RegExp } = {}) {
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
    },
    async getContentFrameModern({ urlPattern = /http:\/\/localhost/ }: { urlPattern?: RegExp } = {}) {
      await this.waitForContentFrameModern({ urlPattern })
      throw new Error('Simple Browser WebContentsView does not expose a Playwright frame in this IDE version')
    },
    async getContentFrame({ urlPattern = /http:\/\/localhost/ }: { urlPattern?: RegExp } = {}) {
      if (ideVersion.minor >= 118) {
        // TODO
        return this.getContentFrameModern({ urlPattern })
      }
      return this.getContentFrameLegacy({ urlPattern })
    },
    async tryClickFirstVisible(locators: readonly any[]): Promise<boolean> {
      for (const locator of locators) {
        try {
          if (await locator.isVisible()) {
            await locator.click()
            await page.waitForIdle()
            return true
          }
        } catch {
          // Ignore selector mismatches and keep trying fallbacks.
        }
      }
      return false
    },
    async hasAttachedChatContext(): Promise<boolean> {
      const contextLabel = page.locator('.chat-attached-context [aria-label^="Attached context,"]').first()
      return contextLabel.isVisible().catch(() => false)
    },
    async addConsoleLogsToChat() {
      try {
        await page.waitForIdle()
        if (ideVersion.minor >= 118) {
          const quickPick = QuickPick.create({ electronApp, expect, ideVersion, page, platform, VError })
          await quickPick.executeCommand(WellKnownCommands.FocusRightEditorGroup)
          await this.activateModernBrowserEditor()
        }
        const quickPick = QuickPick.create({ electronApp, expect, ideVersion, page, platform, VError })
        const directActionCandidates = [
          page.locator('[role="button"][aria-label*="Add Console Logs to Chat"]'),
          page.locator('[role="button"][aria-label*="Add console logs to chat"]'),
          page.locator('[role="button"][aria-label*="Console Logs"]'),
          page.locator('[role="button"]', {
            hasText: 'Console Logs',
          }),
        ]
        const moreActionsCandidates = [
          page.locator('[role="button"][aria-label^="More Actions"]'),
          page.locator('[aria-label="More Actions..."]'),
          page.locator('.monaco-toolbar .toolbar-toggle-more'),
          page.locator('.monaco-toolbar [class*="toolbar-more"]'),
        ]
        const menuActionCandidates = [
          page.locator('.context-view.monaco-menu-container .actions-container .action-item', {
            hasText: 'Add Console Logs to Chat',
          }),
          page.locator('.context-view.monaco-menu-container .actions-container .action-item', {
            hasText: 'Add console logs to chat',
          }),
          page.locator('.context-view.monaco-menu-container .actions-container .action-item', {
            hasText: 'Console Logs',
          }),
        ]

        const maxAttempts = 20
        for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
          if (await this.tryClickFirstVisible(directActionCandidates)) {
            const attached = await this.waitForCondition({
              condition: () => this.hasAttachedChatContext(),
              timeout: 2_000,
            }).then(
              () => true,
              () => false,
            )
            if (attached) {
              return
            }
          }
          if (await this.tryClickFirstVisible(moreActionsCandidates)) {
            if (await this.tryClickFirstVisible(menuActionCandidates)) {
              const attached = await this.waitForCondition({
                condition: () => this.hasAttachedChatContext(),
                timeout: 2_000,
              }).then(
                () => true,
                () => false,
              )
              if (attached) {
                return
              }
            }
            await page.keyboard.press('Escape')
            await page.waitForIdle()
          }
          await new Promise((resolve) => {
            setTimeout(resolve, 200)
          })
        }

        if (ideVersion.minor >= 118) {
          await this.activateModernBrowserEditor()
        }
        await page.waitForIdle()
        await quickPick.executeCommand(WellKnownCommands.BrowserAddConsoleLogsToChat)
        await this.waitForCondition({
          condition: () => this.hasAttachedChatContext(),
          timeout: 10_000,
        })
      } catch (error) {
        throw new VError(error, `Failed to add console logs to chat`)
      }
    },
    async addElementToChat({ selector }: { selector: string }) {
      try {
        await page.waitForIdle()
        const add = page.locator('.element-selection-message')
        await expect(add).toBeVisible()
        const button = add.locator('[role="button"][aria-label="Click to select an element."]')
        await expect(button).toBeVisible()
        await button.click()
        await page.waitForIdle()
        const innerFrame = await this.getContentFrame({
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
        const innerFrame = await this.getContentFrame()
        await innerFrame.waitForIdle()
        const link = innerFrame.locator(`a[href="${href}"]`)
        await expect(link).toBeVisible()
        await link.click()
        await innerFrame.waitForIdle()
        await page.waitForIdle()
        await this.getContentFrame({
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
        const button = await this.getBrowserNavigationButton({
          names: ['Go Back', 'Back', 'Navigate Back'],
        })
        await expect(button).toBeVisible()
        await button.click()
        await page.waitForIdle()
        await this.getContentFrame({ urlPattern })
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
    async createDeferredMockServer({ id, port }: { id: string; port: number }) {
      try {
        await page.waitForIdle()
        const server = await createDeferredMockServer({ port })
        this.mockServers[id] = server
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to create deferred mock server`)
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
    async finishMockServerResponse({ id }: { id: string }) {
      try {
        const server = this.mockServers[id] as DeferredMockServer
        server.finishResponse()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to finish mock server response`)
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
    async openMoreActions() {
      try {
        await page.waitForIdle()
        const urlInput = this.getBrowserUrlInput()
        await expect(urlInput).toBeVisible()
        const moreActions = page.locator('.part.editor [aria-label="More Actions..."], .part.editor [aria-label^="More Actions"]').last()
        await expect(moreActions).toBeVisible()
        await moreActions.focus()
        await expect(moreActions).toBeFocused()
        await moreActions.click()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to open simple browser more actions`)
      }
    },
    async openDevtools() {
      try {
        const electron = Electron.create({ electronApp, expect, ideVersion, page, platform, VError })
        const initialWindowCount = await electron.getWindowCount()
        const quickPick = QuickPick.create({ electronApp, expect, ideVersion, page, platform, VError })

        await quickPick.executeCommand(WellKnownCommands.DeveloperOpenWebviewDeveloperTools, {
          pressKeyOnce: true,
        })

        await electron.waitForWindowCount(initialWindowCount + 1)

        const devtoolsWindowId = await electron.getNewWindowId()
        if (!devtoolsWindowId) {
          throw new Error('Expected devtools window to open')
        }

        await electron.waitForWindowVisible(devtoolsWindowId)

        return devtoolsWindowId
      } catch (error) {
        throw new VError(error, `Failed to open simple browser devtools`)
      }
    },
    async forward({ urlPattern = /http:\/\/localhost/ }: { urlPattern?: RegExp } = {}) {
      try {
        await page.waitForIdle()
        const button = await this.getBrowserNavigationButton({
          names: ['Go Forward', 'Forward', 'Navigate Forward'],
        })
        await expect(button).toBeVisible()
        await button.click()
        await page.waitForIdle()
        await this.getContentFrame({ urlPattern })
      } catch (error) {
        throw new VError(error, `Failed to navigate simple browser forward`)
      }
    },
    async reload({ urlPattern = /http:\/\/localhost/ }: { urlPattern?: RegExp } = {}) {
      try {
        await page.waitForIdle()
        const innerFrame = await this.getContentFrame({ urlPattern })
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
        if (ideVersion.minor >= 118) {
          const electron = this.getElectron()
          await electron.waitForWebContentsText({
            selector,
            text,
            urlPattern,
          })
          await page.waitForIdle()
          return
        }
        const innerFrame = await this.getContentFrame({ urlPattern })
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
        const tab = this.getSimpleBrowserTab()
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
    async shouldHaveTabLoadingSpinner() {
      try {
        await page.waitForIdle()
        await this.waitForCondition({
          condition: () => this.isSimpleBrowserTabLoading(),
        })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to verify simple browser tab loading spinner`)
      }
    },
    async shouldNotHaveTabLoadingSpinner() {
      try {
        await this.waitForCondition({
          condition: async () => {
            return !(await this.isSimpleBrowserTabLoading())
          },
        })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to verify simple browser tab loading spinner is hidden`)
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
    async shouldHaveFindWidget() {
      try {
        await page.waitForIdle()
        const findWidget = this.getBrowserFindWidget()
        await expect(findWidget).toBeVisible()
        const findInput = findWidget.locator('.monaco-findInput textarea[aria-label="Find"]')
        await expect(findInput).toBeVisible()
        await expect(findInput).toBeFocused()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to verify simple browser find widget`)
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

      const tab = this.getSimpleBrowserTab()
      await expect(tab).toBeVisible()
      await page.waitForIdle()
      await expect(tab).toHaveCount(1)
      await page.waitForIdle()
      await this.getContentFrame({
        urlPattern: new RegExp(escapeRegExp(url)),
      })
    },
    async showModern({ url }: { url: string }) {
      await this.openIntegratedBrowser()
      await this.navigateIntegratedBrowser({
        url,
        waitForContentFrame: true,
      })
    },
    async showLoadError({ url }: { url: string }) {
      try {
        if (ideVersion.minor < 113) {
          throw new Error('Integrated browser is not available in this IDE version')
        }
        await this.openIntegratedBrowser()
        await this.navigateIntegratedBrowser({
          url,
          waitForContentFrame: false,
        })
      } catch (error) {
        throw new VError(error, `Failed to open simple browser load error page`)
      }
    },
    async show({ path = '', port, url }: { path?: string; port?: number; url?: string }) {
      try {
        const browserUrl = this.getUrl({ path, port, url })
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

  return api
}
