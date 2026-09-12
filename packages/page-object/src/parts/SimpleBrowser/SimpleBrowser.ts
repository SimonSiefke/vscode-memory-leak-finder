import { execFile } from 'node:child_process'
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
const usedPorts = new Set<number>()

const getProcessIdsUsingPort = async (port: number): Promise<readonly number[]> => {
  return new Promise((resolve, reject) => {
    execFile('lsof', ['-nP', `-tiTCP:${port}`, '-sTCP:LISTEN'], (error, stdout) => {
      if (error) {
        if (error.code === 1) {
          resolve([])
          return
        }
        reject(error)
        return
      }
      resolve(stdout.trim().split('\n').filter(Boolean).map(Number))
    })
  })
}

const allocateRandomPort = async (): Promise<number> => {
  const server = createServer()
  const { promise, reject, resolve } = Promise.withResolvers<void>()
  server.once('error', reject)
  server.listen(0, '127.0.0.1', resolve)
  await promise
  const address = server.address()
  if (!address || typeof address === 'string') {
    throw new Error('Failed to determine random port')
  }
  const port = address.port
  await new Promise<void>((resolve) => server.close(() => resolve()))
  usedPorts.add(port)
  return port
}

const killUsedPorts = async (): Promise<void> => {
  try {
    const processIds = new Set((await Promise.all([...usedPorts].map(getProcessIdsUsingPort))).flat())
    for (const processId of processIds) {
      try {
        process.kill(processId, 'SIGKILL')
      } catch {
        // The process already exited.
      }
    }
  } finally {
    usedPorts.clear()
  }
}

const escapeRegExp = (value: string): string => {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const getDurationMs = (start: number): number => {
  return Math.round((performance.now() - start) * 1000) / 1000
}

const isHttpUrl = (url: string): boolean => {
  return /^https?:\/\//.test(url)
}

const logPhase = (phase: string, start: number, details: Record<string, unknown> = {}): void => {
  console.log('SimpleBrowser:phase', {
    phase,
    durationMs: getDurationMs(start),
    ...details,
  })
}

const timePhase = async <T>(phase: string, details: Record<string, unknown>, fn: () => Promise<T>): Promise<T> => {
  const start = performance.now()
  try {
    const result = await fn()
    logPhase(phase, start, {
      ...details,
      status: 'ok',
    })
    return result
  } catch (error) {
    logPhase(phase, start, {
      ...details,
      status: 'error',
    })
    throw error
  }
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
        if (ideVersion.minor >= 118) {
          await this.waitForContentFrameModern({ urlPattern })
        } else {
          await this.getContentFrame({ urlPattern })
        }
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
          await this.clickBrowserWebContentsLink({ selector })
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
    async clickBrowserWebContentsLink({ selector }: { selector: string }) {
      if (!this.modernBrowserWebContentsId) {
        throw new Error('No tracked browser web contents available')
      }
      const electron = this.getElectron()
      const point = await electron.executeJavaScriptInWebContents({
        expression: `(async () => {
  const targets = Array.from(document.querySelectorAll(${JSON.stringify(selector)}))
  if (targets.length === 0) {
    throw new Error('Expected element matching selector ' + ${JSON.stringify(selector)})
  }
  const getClickPoint = (link, element) => {
    const style = getComputedStyle(element)
    if (style.display === 'none' || style.visibility === 'hidden') {
      return undefined
    }
    for (const rect of element.getClientRects()) {
      if (rect.width > 0 && rect.height > 0) {
        const xValues = [0.25, 0.5, 0.75]
        const yValues = [0.25, 0.5, 0.75]
        for (const yRatio of yValues) {
          for (const xRatio of xValues) {
            const x = Math.round(rect.left + rect.width * xRatio)
            const y = Math.round(rect.top + rect.height * yRatio)
            const hit = document.elementFromPoint(x, y)
            if (hit === link || link.contains(hit)) {
              return {
                x,
                y,
              }
            }
          }
        }
      }
    }
    return undefined
  }
  for (const target of targets) {
    if (!(target instanceof HTMLElement)) {
      continue
    }
    const link = target instanceof HTMLAnchorElement ? target : target.closest('a')
    if (!(link instanceof HTMLElement)) {
      continue
    }
    link.scrollIntoView({
      block: 'center',
      inline: 'center',
    })
    await new Promise((resolve) => requestAnimationFrame(resolve))
    const elements = [link, ...link.querySelectorAll('*')]
    for (const element of elements) {
      if (!(element instanceof HTMLElement)) {
        continue
      }
      const point = getClickPoint(link, element)
      if (point) {
        return point
      }
    }
  }
  throw new Error('Expected visible link matching selector ' + ${JSON.stringify(selector)})
})()`,
        webContentsId: this.modernBrowserWebContentsId,
      })
      if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') {
        throw new Error(`Failed to compute click point for ${selector}`)
      }
      await electron.evaluate(`(async () => {
  const { webContents } = globalThis._____electron
  const targetWebContents = webContents.fromId(${this.modernBrowserWebContentsId})
  if (!targetWebContents || targetWebContents.isDestroyed()) {
    throw new Error('webcontents not found')
  }
  const point = ${JSON.stringify(point)}
  const wasAttached = targetWebContents.debugger.isAttached()
  if (!wasAttached) {
    targetWebContents.debugger.attach('1.3')
  }
  try {
    const dispatchMouseEvent = (params) => {
      return targetWebContents.debugger.sendCommand('Input.dispatchMouseEvent', params)
    }
    await dispatchMouseEvent({
      type: 'mouseMoved',
      x: point.x,
      y: point.y,
    })
    await dispatchMouseEvent({
      button: 'left',
      buttons: 1,
      clickCount: 1,
      type: 'mousePressed',
      x: point.x,
      y: point.y,
    })
    await dispatchMouseEvent({
      button: 'left',
      buttons: 0,
      clickCount: 1,
      type: 'mouseReleased',
      x: point.x,
      y: point.y,
    })
  } finally {
    if (!wasAttached && targetWebContents.debugger.isAttached()) {
      targetWebContents.debugger.detach()
    }
  }
})()`)
      await page.waitForIdle()
    },
    async dragBrowserWebContents({ deltaX, deltaY, selector }: { deltaX: number; deltaY: number; selector: string }) {
      if (!this.modernBrowserWebContentsId) {
        throw new Error('No tracked browser web contents available')
      }
      const electron = this.getElectron()
      const point = await electron.executeJavaScriptInWebContents({
        expression: `(() => {
  const element = document.querySelector(${JSON.stringify(selector)})
  if (!(element instanceof HTMLElement)) {
    throw new Error('Expected element matching selector ' + ${JSON.stringify(selector)})
  }
  element.scrollIntoView({ block: 'center', inline: 'center' })
  const rect = element.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) {
    throw new Error('Expected visible element matching selector ' + ${JSON.stringify(selector)})
  }
  return {
    x: Math.round(rect.left + rect.width / 2 - ${deltaX} / 2),
    y: Math.round(rect.top + rect.height / 2 - ${deltaY} / 2),
  }
})()`,
        webContentsId: this.modernBrowserWebContentsId,
      })
      if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') {
        throw new Error(`Failed to compute drag point for ${selector}`)
      }
      await electron.evaluate(`(async () => {
  const { webContents } = globalThis._____electron
  const targetWebContents = webContents.fromId(${this.modernBrowserWebContentsId})
  if (!targetWebContents || targetWebContents.isDestroyed()) {
    throw new Error('webcontents not found')
  }
  const point = ${JSON.stringify(point)}
  const deltaX = ${deltaX}
  const deltaY = ${deltaY}
  const wasAttached = targetWebContents.debugger.isAttached()
  if (!wasAttached) {
    targetWebContents.debugger.attach('1.3')
  }
  try {
    const dispatchMouseEvent = (params) => targetWebContents.debugger.sendCommand('Input.dispatchMouseEvent', params)
    await dispatchMouseEvent({ type: 'mouseMoved', x: point.x, y: point.y })
    await dispatchMouseEvent({ button: 'left', buttons: 1, clickCount: 1, type: 'mousePressed', x: point.x, y: point.y })
    for (let index = 1; index <= 5; index++) {
      await dispatchMouseEvent({
        button: 'left',
        buttons: 1,
        type: 'mouseMoved',
        x: point.x + deltaX * index / 5,
        y: point.y + deltaY * index / 5,
      })
    }
    await dispatchMouseEvent({
      button: 'left',
      buttons: 0,
      clickCount: 1,
      type: 'mouseReleased',
      x: point.x + deltaX,
      y: point.y + deltaY,
    })
  } finally {
    if (!wasAttached && targetWebContents.debugger.isAttached()) {
      targetWebContents.debugger.detach()
    }
  }
})()`)
      await page.waitForIdle()
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
    async executeJavaScript({ expression, timeout }: { expression: string; timeout?: number }) {
      try {
        if (ideVersion.minor >= 118) {
          const electron = this.getElectron()
          if (!this.modernBrowserWebContentsId) {
            throw new Error('No tracked browser web contents available')
          }
          await electron.executeJavaScriptInWebContents({
            expression,
            ...(timeout === undefined ? {} : { timeout }),
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
    async executeWorkbenchCommand(commandId: string, ...args: readonly unknown[]): Promise<boolean> {
      const result = await page.evaluate({
        awaitPromise: true,
        expression: `((async () => {
  const args = ${JSON.stringify(args)}
  const candidates = [
    ['workbench', globalThis.workbench?.commands],
    ['vscode', globalThis.vscode?.commands],
    ['monaco', globalThis.monaco?.commands],
    ['mainWindow', globalThis.mainWindow?.commands],
  ]
  for (const [source, commands] of candidates) {
    if (commands && typeof commands.executeCommand === 'function') {
      try {
        await commands.executeCommand(${JSON.stringify(commandId)}, ...args)
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
        if (ideVersion.minor >= 118) {
          await this.waitForContentFrameModern({ urlPattern })
        } else {
          await this.getContentFrame({ urlPattern })
        }
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
        const button = page
          .locator(
            [
              `.part.editor [role="button"][aria-label^="${name}"]`,
              `.part.editor [role="button"][title^="${name}"]`,
              `.part.editor button[aria-label^="${name}"]`,
              `.part.editor button[title^="${name}"]`,
              `.part.editor .action-label[aria-label^="${name}"]`,
              `.part.editor .action-label[title^="${name}"]`,
            ].join(', '),
          )
          .first()
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
    async waitForBrowserUrlDisplay({ timeout = 2000, urlPattern }: { timeout?: number; urlPattern: RegExp }): Promise<void> {
      const startTime = performance.now()
      while (true) {
        const values = await page.evaluate({
          expression: `(() => {
  const selectors = [
    '.browser-url-display',
    '.browser-url-input',
  ]
  return selectors.flatMap((selector) => {
    return Array.from(document.querySelectorAll(selector)).map((element) => {
      return [
        element.value || '',
        element.textContent || '',
        element.getAttribute('aria-label') || '',
        element.getAttribute('title') || '',
      ].join('\\n')
    })
  })
})()`,
          returnByValue: true,
        })
        if (Array.isArray(values) && values.some((value) => typeof value === 'string' && urlPattern.test(value))) {
          return
        }
        if (performance.now() - startTime > timeout) {
          throw new Error(`Browser URL display did not match ${urlPattern}. Found: ${Array.isArray(values) ? values.join(', ') : ''}`)
        }
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    },
    async getContentFrame({ urlPattern = /http:\/\/localhost/ }: { urlPattern?: RegExp } = {}) {
      if (ideVersion.minor >= 118) {
        // TODO
        return this.getContentFrameModern({ urlPattern })
      }
      return this.getContentFrameLegacy({ urlPattern })
    },
    async getRandomPort() {
      return allocateRandomPort()
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
    async killAllPorts() {
      await killUsedPorts()
    },
    async trackPort(port: number) {
      usedPorts.add(port)
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
      await timePhase('navigateIntegratedBrowser.urlInputVisible', { url }, async () => {
        await expect(urlInput).toBeVisible()
      })
      if (ideVersion.minor >= 120) {
        await timePhase('navigateIntegratedBrowser.enterModernUrl', { url }, async () => {
          await urlInput.click()
          const quickInput = page.locator('.quick-input-widget .ibwrapper .input')
          await expect(quickInput).toBeVisible()
          await quickInput.fill('')
          await quickInput.type(url)
          await expect(quickInput).toHaveValue(url)
          await quickInput.press('Enter')
        })
      } else {
        await urlInput.fill('')
        await page.waitForIdle()
        await urlInput.type(url)
        await page.waitForIdle()
        await urlInput.press('Enter')
        await page.waitForIdle()
      }
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
      const totalStart = performance.now()
      const quickPick = QuickPick.create({ electronApp, expect, ideVersion, page, platform, VError })
      const electron = this.getElectron()
      const openDirectly = ideVersion.minor >= 120 && isHttpUrl(url)
      const existingWebContentsIds =
        ideVersion.minor >= 118
          ? await timePhase('openIntegratedBrowser.getExistingWebContents', { url }, async () => {
              return (await electron.getAllWebContents()).map((entry) => entry.id)
            })
          : []

      try {
        await timePhase('openIntegratedBrowser.clearNotifications', { url }, async () => {
          await quickPick.executeCommand(WellKnownCommands.ClearAllNotifications, {
            pressKeyOnce: true,
          })
        })
      } catch {
        // Notifications are not always present, and failing to clear them should not block browser tests.
      }
      const openedDirectly = openDirectly
        ? await (async () => {
            const start = performance.now()
            const opened = await this.executeWorkbenchCommand('workbench.action.browser.open', url)
            logPhase('openIntegratedBrowser.executeWorkbenchCommand', start, {
              url,
              openedDirectly: opened,
            })
            return opened
          })()
        : false
      if (!openedDirectly) {
        await timePhase('openIntegratedBrowser.executeCommand', { url }, async () => {
          await quickPick.executeCommand(WellKnownCommands.OpenIntegratedBrower, {
            pressKeyOnce: true,
            stayVisible: 'dont-care',
            stopsApplication: ideVersion.minor >= 120,
          })
        })
        if (ideVersion.minor < 120 || (url && !isHttpUrl(url))) {
          await page.waitForIdle()
        }
        if (ideVersion.minor >= 120) {
          await timePhase('openIntegratedBrowser.enterInitialUrl', { url }, async () => {
            const intermediate = page.locator('input[aria-label^="Enter a URL"],input[aria-label="Search or enter URL"]')
            await expect(intermediate).toBeVisible()
            await expect(intermediate).toBeFocused()
            if (url) {
              await intermediate.fill('')
              await intermediate.type(url)
              if (!isHttpUrl(url)) {
                await page.waitForIdle()
              }
              await expect(intermediate).toHaveValue(url)
            }
            if (!url || isHttpUrl(url)) {
              await intermediate.press('Enter')
              await expect(intermediate).toBeHidden()
            } else {
              await page.waitForIdle()
              await page.keyboard.press('Enter')
              await page.waitForIdle()
              await expect(intermediate).toBeHidden()
              await page.waitForIdle()
            }
          })
        }
      }
      const urlInput = this.getBrowserUrlInput()
      await timePhase('openIntegratedBrowser.browserChromeVisible', { url }, async () => {
        await expect(urlInput).toBeVisible()
      })
      if (ideVersion.minor >= 120 && isHttpUrl(url)) {
        await timePhase('openIntegratedBrowser.confirmInitialUrlSubmitted', { url }, async () => {
          const quickInput = page.locator('.quick-input-widget .ibwrapper .input')
          if (await quickInput.isVisible().catch(() => false)) {
            await expect(quickInput).toHaveValue(url)
            await quickInput.press('Enter')
          }
        })
      }
      if (ideVersion.minor < 120 || !isHttpUrl(url)) {
        await timePhase('openIntegratedBrowser.closeStrayQuickInput', { url }, async () => {
          const quickInput = page.locator('.quick-input-widget')
          if (await quickInput.isVisible().catch(() => false)) {
            await page.keyboard.press('Escape')
            await expect(quickInput)
              .toBeHidden({
                timeout: 3000,
              })
              .catch(() => {})
          }
        })
      }
      if (ideVersion.minor < 120) {
        await page.waitForIdle()
      }
      if (ideVersion.minor >= 118) {
        const entry = await timePhase(
          'openIntegratedBrowser.waitForNewWebContents',
          {
            url,
          },
          async () => {
            return electron.waitForNewWebContentsView({
              existingIds: existingWebContentsIds,
            })
          },
        )
        this.modernBrowserWebContentsId = entry.id
        logPhase('openIntegratedBrowser.total', totalStart, {
          url,
          webContentsId: entry.id,
          webContentsUrl: entry.url,
        })
      } else if (ideVersion.minor >= 118) {
        logPhase('openIntegratedBrowser.total', totalStart, {
          url,
          webContentsId: '',
          webContentsUrl: '',
        })
      } else {
        logPhase('openIntegratedBrowser.total', totalStart, {
          url,
          webContentsId: '',
          webContentsUrl: '',
        })
      }
      if (ideVersion.minor < 118) {
        await page.waitForIdle()
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
      timeout = 10_000,
      urlPattern = /http:\/\/localhost/,
    }: {
      selector?: string
      text: string
      timeout?: number
      urlPattern?: RegExp
    }) {
      try {
        await page.waitForIdle()
        if (ideVersion.minor >= 118) {
          const electron = this.getElectron()
          const webContentsTextOptions = this.modernBrowserWebContentsId
            ? {
                selector,
                text,
                timeout,
                urlPattern,
                webContentsId: this.modernBrowserWebContentsId,
              }
            : {
                selector,
                text,
                timeout,
                urlPattern,
              }
          await electron.waitForWebContentsText(webContentsTextOptions)
          await page.waitForIdle()
          return
        }
        const innerFrame = await this.getContentFrame({ urlPattern })
        const locator = innerFrame.locator(selector)
        await expect(locator).toContainText(text, { timeout })
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
    async waitForContentFrameModern({
      timeout = 10_000,
      urlPattern = /http:\/\/localhost/,
    }: { timeout?: number; urlPattern?: RegExp } = {}) {
      const electron = this.getElectron()
      const trackedWebContentsId = this.modernBrowserWebContentsId
      const entry = await timePhase(
        'waitForContentFrameModern',
        {
          urlPattern: String(urlPattern),
          webContentsId: trackedWebContentsId || '',
        },
        async () => {
          if (trackedWebContentsId) {
            try {
              return await electron.waitForWebContentsUrl({
                timeout: Math.min(timeout, 1000),
                urlPattern,
                webContentsId: trackedWebContentsId,
              })
            } catch (error) {
              console.log('SimpleBrowser:phase', {
                phase: 'waitForContentFrameModern.trackedMiss',
                webContentsId: trackedWebContentsId,
                urlPattern: String(urlPattern),
                error: error instanceof Error ? error.message : String(error),
              })
              await this.waitForBrowserUrlDisplay({
                timeout: Math.min(timeout, 2000),
                urlPattern,
              })
              try {
                return await electron.waitForWebContentsUrl({
                  timeout,
                  urlPattern,
                  webContentsId: trackedWebContentsId,
                })
              } catch {
                // Fall back to finding the browser by URL below.
              }
            }
          }
          return electron.waitForWebContentsView({
            timeout,
            urlPattern,
          })
        },
      )
      this.modernBrowserWebContentsId = entry.id
      logPhase('waitForContentFrameModern.ready', performance.now(), {
        urlPattern: String(urlPattern),
        webContentsId: entry.id,
        webContentsUrl: entry.url,
      })
      if (ideVersion.minor >= 120) {
        await timePhase('waitForContentFrameModern.closeQuickInput', { urlPattern: String(urlPattern) }, async () => {
          const quickInput = page.locator('.quick-input-widget')
          if (await quickInput.isVisible().catch(() => false)) {
            await quickInput.locator('.ibwrapper .input, input, textarea').first().focus()
            await page.keyboard.press('Enter')
            await page.waitForIdle()
            if (await quickInput.isVisible().catch(() => false)) {
              const closeButton = quickInput.locator('[aria-label="Close"], .codicon-close, .quick-input-action').first()
              if (await closeButton.isVisible().catch(() => false)) {
                await closeButton.click()
              }
            }
            if (await quickInput.isVisible().catch(() => false)) {
              await page.keyboard.press('Escape')
            }
            await expect(quickInput).toBeHidden({ timeout: 10_000 })
          }
        })
      }
    },
  }

  return api
}
