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
    async activateChatEditorForBrowserContext() {
      const candidates = [
        page.locator('[role="tab"][aria-label^="Chat, Editor Group 2"]').first(),
        page.locator('[role="tab"][data-resource-name^="chat-"]').first(),
        page.locator('.tab', { hasText: 'Chat' }),
      ]
      if (await this.tryClickFirstVisible(candidates)) {
        await page.waitForIdle()
      }
    },
    async activateModernBrowserEditor() {
      const electron = this.getElectron()
      const entry = this.modernBrowserWebContentsId
        ? await electron.waitForWebContentsUrl({
            urlPattern: /^https?:\/\//,
            webContentsId: this.modernBrowserWebContentsId,
          })
        : await electron.waitForWebContentsView({
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
    async addConsoleLogsToChat() {
      try {
        await page.waitForIdle()
        console.log('addConsoleLogsToChat:start', { webContentsId: this.modernBrowserWebContentsId })
        if (ideVersion.minor >= 118) {
          const quickPick = QuickPick.create({ electronApp, expect, ideVersion, page, platform, VError })
          await quickPick.executeCommand(WellKnownCommands.FocusRightEditorGroup)
          await this.activateModernBrowserEditor()
        }
        const quickPick = QuickPick.create({ electronApp, expect, ideVersion, page, platform, VError })
        const directActionCandidates = [
          page.locator('.part.editor .action-item', {
            hasText: 'Add Console Logs to Chat',
          }),
          page.locator('.part.editor .action-label', {
            hasText: 'Add Console Logs to Chat',
          }),
          page.locator('.monaco-toolbar .action-item', {
            hasText: 'Add Console Logs to Chat',
          }),
          page.locator('.monaco-toolbar .action-label', {
            hasText: 'Add Console Logs to Chat',
          }),
          page.locator('[role="button"][aria-label*="Add Console Logs to Chat"]'),
          page.locator('[role="button"][aria-label*="Add console logs to chat"]'),
          page.locator('[aria-label*="Add Console Logs to Chat"]'),
          page.locator('[aria-label*="Add console logs to chat"]'),
          page.locator('[title*="Add Console Logs to Chat"]'),
          page.locator('[title*="Add console logs to chat"]'),
          page.locator('.monaco-toolbar [aria-label*="Add Console Logs to Chat"], .monaco-toolbar [title*="Add Console Logs to Chat"]'),
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
          page.locator(
            '.context-view.monaco-menu-container [aria-label*="Add Console Logs to Chat"], .context-view.monaco-menu-container [title*="Add Console Logs to Chat"]',
          ),
        ]

        const maxAttempts = 20
        for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
          if (await this.tryClickFirstVisible(directActionCandidates)) {
            console.log('addConsoleLogsToChat:clickedDirectAction', { attempt })
            await this.activateChatEditorForBrowserContext()
            const attached = await this.waitForCondition({
              condition: () => this.hasAttachedChatContext(),
              timeout: 2000,
            }).then(
              () => true,
              () => false,
            )
            console.log('addConsoleLogsToChat:directActionAttached', {
              attached,
              attempt,
              counts: await this.getAttachedChatContextCounts(),
            })
            if (attached) {
              return
            }
          }
          if (await this.tryClickFirstVisible(moreActionsCandidates)) {
            console.log('addConsoleLogsToChat:openedMoreActions', { attempt })
            if (await this.tryClickFirstVisible(menuActionCandidates)) {
              console.log('addConsoleLogsToChat:clickedMenuAction', { attempt })
              await this.activateChatEditorForBrowserContext()
              const attached = await this.waitForCondition({
                condition: () => this.hasAttachedChatContext(),
                timeout: 2000,
              }).then(
                () => true,
                () => false,
              )
              console.log('addConsoleLogsToChat:menuActionAttached', {
                attached,
                attempt,
                counts: await this.getAttachedChatContextCounts(),
              })
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
        if (await this.executeWorkbenchCommand('workbench.action.browser.addConsoleLogsToChat')) {
          console.log('addConsoleLogsToChat:executedWorkbenchCommand')
          await this.activateChatEditorForBrowserContext()
          await this.waitForCondition({
            condition: () => this.hasAttachedChatContext(),
            timeout: 10_000,
          })
          return
        }
        try {
          await quickPick.executeCommand(WellKnownCommands.BrowserAddConsoleLogsToChat)
        } catch (error) {
          const debug = await this.getVisibleTabAndActionLabels()
          throw new Error(
            `Command palette fallback failed. Tabs: ${JSON.stringify(debug?.tabs || [])}. Actions: ${JSON.stringify(debug?.actions || [])}. ${error}`,
          )
        }
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
    async clickPageLink({
      headingText = '',
      requireHeading = false,
      selector,
      urlPattern = /^https?:\/\//,
    }: {
      headingText?: string
      requireHeading?: boolean
      selector: string
      urlPattern?: RegExp
    }) {
      try {
        await page.waitForIdle()
        if (ideVersion.minor >= 118) {
          const electron = this.getElectron()
          if (!this.modernBrowserWebContentsId) {
            throw new Error('No tracked browser web contents available')
          }
          await electron.executeJavaScriptInWebContents({
            expression: `(() => {
  const link = document.querySelector(${JSON.stringify(selector)})
  if (!(link instanceof HTMLAnchorElement)) {
    throw new Error('Expected link matching selector ' + ${JSON.stringify(selector)})
  }
  link.scrollIntoView({
    block: 'center',
    inline: 'center',
  })
  link.click()
})()`,
            webContentsId: this.modernBrowserWebContentsId,
          })
          await page.waitForIdle()
          await this.waitForContentFrameModern({
            urlPattern,
          })
          if (headingText) {
            await electron.waitForWebContentsText({
              selector: 'h1',
              text: headingText,
              urlPattern,
              webContentsId: this.modernBrowserWebContentsId,
            })
          } else if (requireHeading) {
            await electron.executeJavaScriptInWebContents({
              expression: `(async () => {
  for (let attempt = 0; attempt < 60; attempt++) {
    const headingText = document.querySelector('h1')?.textContent?.trim() || ''
    if (headingText) {
      return
    }
    await new Promise((resolve) => requestAnimationFrame(resolve))
  }
  throw new Error('Expected page heading')
})()`,
              webContentsId: this.modernBrowserWebContentsId,
            })
          }
          return
        }

        const innerFrame = await this.getContentFrame({
          urlPattern: /^https?:\/\//,
        })
        await innerFrame.waitForIdle()
        const link = innerFrame.locator(selector).first()
        await expect(link).toBeVisible()
        await link.click()
        await innerFrame.waitForIdle()
        await page.waitForIdle()
        const nextFrame = await this.getContentFrame({
          urlPattern,
        })
        if (requireHeading || headingText) {
          const heading = nextFrame.locator('h1')
          await expect(heading).toBeVisible()
          if (headingText) {
            await expect(heading).toContainText(headingText)
          } else {
            await expect(heading).toHaveText(/\S/)
          }
        }
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to click page link ${selector}`)
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
    async executeJavaScript({ expression }: { expression: string }) {
      try {
        if (ideVersion.minor >= 118) {
          const electron = this.getElectron()
          if (!this.modernBrowserWebContentsId) {
            throw new Error('No tracked browser web contents available')
          }
          await electron.executeJavaScriptInWebContents({
            expression,
            webContentsId: this.modernBrowserWebContentsId,
          })
          await page.waitForIdle()
          return
        }
        const innerFrame = await this.getContentFrame()
        await innerFrame.evaluate({
          awaitPromise: true,
          expression,
        })
        await innerFrame.waitForIdle()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to execute JavaScript in simple browser`)
      }
    },
    async executeWorkbenchCommand(commandId: string): Promise<boolean> {
      const result = await page.evaluate({
        awaitPromise: true,
        expression: `((async () => {
  const candidates = [
    ['workbench', globalThis.workbench?.commands],
    ['vscode', globalThis.vscode?.commands],
    ['monaco', globalThis.monaco?.commands],
    ['mainWindow', globalThis.mainWindow?.commands],
  ]
  for (const [source, commands] of candidates) {
    if (commands && typeof commands.executeCommand === 'function') {
      try {
        await commands.executeCommand(${JSON.stringify(commandId)})
        return { ok: true, source }
      } catch (error) {
        return {
          ok: false,
          source,
          error: String(error && error.message ? error.message : error),
        }
      }
    }
  }
  return {
    ok: false,
    globals: Object.keys(globalThis).filter((key) => /workbench|vscode|command|monaco/i.test(key)).slice(0, 50),
  }
})())`,
        returnByValue: true,
      })
      if (result?.ok) {
        return true
      }
      return false
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
    async getAttachedChatContextCounts() {
      return page.evaluate({
        expression: `(() => {
  const elements = Array.from(document.querySelectorAll('.chat-attached-context [aria-label^="Attached context,"]'))
  let visible = 0
  for (const element of elements) {
    const style = window.getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    if (style.display !== 'none' && style.visibility !== 'hidden' && rect.width && rect.height) {
      visible += 1
    }
  }
  return {
    total: elements.length,
    visible,
  }
})()`,
        returnByValue: true,
      })
    },
    getBrowserFindWidget() {
      return page.locator('.browser-find-widget-wrapper .find-widget')
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
    getBrowserUrlInput() {
      if (ideVersion.minor >= 120) {
        return page.locator('.browser-url-display')
      }

      return page.locator('.browser-url-input')
    },
    async getContentFrame({ urlPattern = /http:\/\/localhost/ }: { urlPattern?: RegExp } = {}) {
      if (ideVersion.minor >= 118) {
        // TODO
        return this.getContentFrameModern({ urlPattern })
      }
      return this.getContentFrameLegacy({ urlPattern })
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
    getElectron() {
      return Electron.create({ electronApp, expect, ideVersion, page, platform, VError })
    },
    getSimpleBrowserTab() {
      return page.locator('.tab', { hasText: 'Simple Browser' }).first()
    },
    getUrl({ path = '', port, url }: { path?: string; port: number | undefined; url: string | undefined }): string {
      if (url) {
        return url
      }
      if (typeof port !== 'number') {
        throw new TypeError(`port or url is required`)
      }
      return `http://localhost:${port}${path}`
    },
    async getVisibleTabAndActionLabels() {
      const result = await page.evaluate({
        expression: `(() => {
  const collect = (selector) => {
    return Array.from(document.querySelectorAll(selector))
      .map((element) => {
        const style = window.getComputedStyle(element)
        if (style.display === 'none' || style.visibility === 'hidden') {
          return ''
        }
        const rect = element.getBoundingClientRect()
        if (!rect.width || !rect.height) {
          return ''
        }
        return [
          element.getAttribute('aria-label') || '',
          element.getAttribute('data-resource-name') || '',
          element.getAttribute('title') || '',
          element.textContent || '',
        ]
          .map((value) => value.trim())
          .filter((value) => value.length > 0)
          .join(' | ')
      })
      .filter((value) => value.length > 0)
    }
  return {
    actions: collect('.part.editor [role="button"], .part.editor button, .context-view.monaco-menu-container .action-item'),
    tabs: collect('[role="tab"]'),
  }
})()`,
        returnByValue: true,
      })
      return result
    },
    async hasAttachedChatContext(): Promise<boolean> {
      const contextLabel = page.locator('.chat-attached-context [aria-label^="Attached context,"]').first()
      return contextLabel.isVisible().catch(() => false)
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
    mockServers: Object.create(null) as Record<string, MockServer>,
    modernBrowserWebContentsId: undefined as number | undefined,
    async navigateIntegratedBrowser({ url, waitForContentFrame }: { url: string; waitForContentFrame: boolean }) {
      const urlInput = this.getBrowserUrlInput()
      console.log('nav...')
      await expect(urlInput).toBeVisible()
      if (ideVersion.minor >= 120) {
        await urlInput.click()
        await page.waitForIdle()
        const quickInput = page.locator('.quick-input-widget .ibwrapper .input')
        await expect(quickInput).toBeVisible()
        await quickInput.setValue(url)
        await page.waitForIdle()
        await expect(quickInput).toHaveValue(url)
        await page.waitForIdle()
        await quickInput.press('Enter')
      } else {
        await urlInput.fill('')
        await page.waitForIdle()
        await urlInput.type(url)
        await page.waitForIdle()
        await urlInput.press('Enter')
      }
      await page.waitForIdle()
      console.log('navigateIntegratedBrowser:submitted', { url, webContentsId: this.modernBrowserWebContentsId })
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
    async openIntegratedBrowser({ url = '' }: { url?: string } = {}) {
      const quickPick = QuickPick.create({ electronApp, expect, ideVersion, page, platform, VError })
      const electron = this.getElectron()
      const existingWebContentsIds = ideVersion.minor >= 118 ? (await electron.getAllWebContents()).map((entry) => entry.id) : []
      console.log('openIntegratedBrowser:start', { existingWebContentsIds })

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
        stayVisible: 'dont-care',
      })
      await page.waitForIdle()
      if (ideVersion.minor >= 120) {
        const intermediate = page.locator('input[aria-label^="Enter a URL"]')
        await expect(intermediate).toBeVisible()
        await page.waitForIdle()
        await expect(intermediate).toBeFocused()
        await page.waitForIdle()
        if (url) {
          await intermediate.setValue(url)
          await page.waitForIdle()
          await expect(intermediate).toHaveValue(url)
          await page.waitForIdle()
        }
        await page.keyboard.press('Enter')
        await page.waitForIdle()
        await expect(intermediate).toBeHidden()
        await page.waitForIdle()
      }
      // await new Promise((r) => {})
      const urlInput = this.getBrowserUrlInput()
      // await new Promise((r) => {})
      await expect(urlInput).toBeVisible()
      await page.waitForIdle()
      const quickInput = page.locator('.quick-input-widget')
      if (await quickInput.isVisible().catch(() => false)) {
        await page.keyboard.press('Escape')
        await expect(quickInput)
          .toBeHidden({
            timeout: 3000,
          })
          .catch(() => {})
        await page.waitForIdle()
      }
      // if (ideVersion.minor >= 120) {
      // }
      if (ideVersion.minor >= 118 && ideVersion.minor <= 120) {
        const entry = await electron.waitForNewWebContentsView({
          existingIds: existingWebContentsIds,
        })
        this.modernBrowserWebContentsId = entry.id
        console.log('openIntegratedBrowser:tracked', entry)
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
      return urlInput
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
    async shouldHaveLoadError({ text, title }: { title: string; text: string }) {
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
          console.log('shouldHaveText:modern:start', {
            selector,
            text,
            urlPattern: `${urlPattern}`,
            webContentsId: this.modernBrowserWebContentsId,
          })
          const webContentsTextOptions = this.modernBrowserWebContentsId
            ? {
                selector,
                text,
                urlPattern,
                webContentsId: this.modernBrowserWebContentsId,
              }
            : {
                selector,
                text,
                urlPattern,
              }
          await electron.waitForWebContentsText(webContentsTextOptions)
          console.log('shouldHaveText:modern:done', {
            selector,
            text,
            urlPattern: `${urlPattern}`,
            webContentsId: this.modernBrowserWebContentsId,
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
    async showLoadError({ url }: { url: string }) {
      try {
        if (ideVersion.minor < 113) {
          throw new Error('Integrated browser is not available in this IDE version')
        }
        await this.openIntegratedBrowser({
          url: ideVersion.minor >= 120 ? url : '',
        })
        if (ideVersion.minor >= 120) {
          return
        }
        await this.navigateIntegratedBrowser({
          url,
          waitForContentFrame: false,
        })
      } catch (error) {
        throw new VError(error, `Failed to open simple browser load error page`)
      }
    },
    async showModern({ url }: { url: string }) {
      await this.openIntegratedBrowser({
        url: ideVersion.minor >= 120 ? url : '',
      })
      if (ideVersion.minor >= 120) {
        await this.waitForContentFrameModern({
          urlPattern: new RegExp(escapeRegExp(url)),
        })
        return
      }
      await this.navigateIntegratedBrowser({
        url,
        waitForContentFrame: true,
      })
    },
    async tryClickFirstVisible(locators: readonly any[]): Promise<boolean> {
      for (const locator of locators) {
        try {
          const count = await locator.count().catch(() => 1)
          const maxCount = Math.max(1, count)
          for (let i = 0; i < maxCount; i += 1) {
            const candidate = count > 1 ? locator.nth(i) : locator
            if (await candidate.isVisible().catch(() => false)) {
              await candidate.click()
              await page.waitForIdle()
              return true
            }
          }
        } catch {
          // Ignore selector mismatches and keep trying fallbacks.
        }
      }
      return false
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
    async waitForContentFrameModern({ urlPattern = /http:\/\/localhost/ }: { urlPattern?: RegExp } = {}) {
      const electron = this.getElectron()
      console.log('waitForContentFrameModern:start', { urlPattern: `${urlPattern}`, webContentsId: this.modernBrowserWebContentsId })
      const entry = this.modernBrowserWebContentsId
        ? await electron.waitForWebContentsUrl({
            urlPattern,
            webContentsId: this.modernBrowserWebContentsId,
          })
        : await electron.waitForWebContentsView({
            urlPattern,
          })
      this.modernBrowserWebContentsId = entry.id
      console.log('waitForContentFrameModern:done', { urlPattern: `${urlPattern}`, webContentsId: this.modernBrowserWebContentsId })
      await page.waitForIdle()
    },
  }

  return api
}
