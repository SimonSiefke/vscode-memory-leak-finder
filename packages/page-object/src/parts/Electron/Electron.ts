import type { CreateParams } from '../CreateParams/CreateParams.ts'

type WebContentsEntry = {
  readonly id: number
  readonly ownerWindowId: number | null
  readonly ownerWindowVisible: boolean | null
  readonly title: string
  readonly type: string
  readonly url: string
}

const getWebContentsSummary = (entries: readonly WebContentsEntry[]): string => {
  return entries
    .map((entry) => `${entry.id}:${entry.type}:${entry.url || '<empty>'}`)
    .join(', ')
}

export const create = ({ electronApp, VError }: CreateParams) => {
  return {
    async evaluate(expression: string) {
      return await electronApp.evaluate(expression)
    },
    async getWindowCount(): Promise<number> {
      try {
        await this.evaluate(`(() => {
  const { BrowserWindow } = globalThis._____electron
  globalThis._____windowCount = BrowserWindow.getAllWindows().length
})()`)
        // Return the count that was stored in the global
        return await this.evaluate(`globalThis._____windowCount`)
      } catch (error) {
        throw new VError(error, `Failed to get window count`)
      }
    },
    async getWindowIsVisible(windowId: number): Promise<boolean> {
      try {
        await this.evaluate(`(() => {
          const { BrowserWindow } = globalThis._____electron
          const window = BrowserWindow.fromId(${windowId})
          globalThis._____windowIsVisible = Boolean(window) && !window.isDestroyed() && window.isVisible()
        })()`)
        return await this.evaluate(`globalThis._____windowIsVisible`)
      } catch (error) {
        throw new VError(error, `Failed to get window visibility`)
      }
    },
    async getWindowIds(): Promise<readonly number[]> {
      try {
        await this.evaluate(`(() => {
          const { BrowserWindow } = globalThis._____electron
          const allWindows = BrowserWindow.getAllWindows()
          globalThis._____windowIds = allWindows.map(w => w.id)
        })()`)
        // Return the IDs that were stored in the global
        return await this.evaluate(`globalThis._____windowIds`)
      } catch (error) {
        throw new VError(error, `Failed to get window IDs`)
      }
    },
    async getAllWebContents(): Promise<readonly WebContentsEntry[]> {
      try {
        await this.evaluate(`(() => {
  const { webContents } = globalThis._____electron
  const allWebContents = typeof webContents.getAllWebContents === 'function' ? webContents.getAllWebContents() : []
  globalThis._____allWebContents = allWebContents
    .filter((contents) => contents && !contents.isDestroyed())
    .map((contents) => {
      const ownerWindow = typeof contents.getOwnerBrowserWindow === 'function' ? contents.getOwnerBrowserWindow() : null
      return {
        id: contents.id,
        ownerWindowId: ownerWindow && !ownerWindow.isDestroyed() ? ownerWindow.id : null,
        ownerWindowVisible: ownerWindow && !ownerWindow.isDestroyed() ? ownerWindow.isVisible() : null,
        title: typeof contents.getTitle === 'function' ? contents.getTitle() : '',
        type: typeof contents.getType === 'function' ? contents.getType() : '',
        url: typeof contents.getURL === 'function' ? contents.getURL() : '',
      }
    })
})()`)
        return await this.evaluate(`globalThis._____allWebContents`)
      } catch (error) {
        throw new VError(error, `Failed to get all web contents`)
      }
    },
    async waitForWebContentsView({ timeout = 10_000, urlPattern }: { timeout?: number; urlPattern: RegExp }): Promise<WebContentsEntry> {
      try {
        const startTime = performance.now()
        while (true) {
          const entries = await this.getAllWebContents()
          const match = entries.find((entry) => {
            return urlPattern.test(entry.url) && entry.ownerWindowVisible !== false
          })
          if (match) {
            return match
          }
          if (performance.now() - startTime > timeout) {
            throw new Error(`No visible web contents matched ${urlPattern}. Found: ${getWebContentsSummary(entries)}`)
          }
          await new Promise((resolve) => setTimeout(resolve, 100))
        }
      } catch (error) {
        throw new VError(error, `Failed to wait for web contents view`)
      }
    },
    async executeJavaScriptInWebContents({ expression, timeout = 10_000, webContentsId }: { expression: string; timeout?: number; webContentsId: number }) {
      try {
        await this.evaluate(`(() => {
  const { webContents } = globalThis._____electron
  const targetWebContents = webContents.fromId(${webContentsId})
  if (!targetWebContents || targetWebContents.isDestroyed()) {
    globalThis._____webContentsExecutionResult = {
      status: 'error',
      message: 'webcontents not found',
    }
    return
  }
  globalThis._____webContentsExecutionResult = {
    status: 'pending',
  }
  targetWebContents.executeJavaScript(${JSON.stringify(expression)}).then(
    (value) => {
      globalThis._____webContentsExecutionResult = {
        status: 'resolved',
        value,
      }
    },
    (error) => {
      globalThis._____webContentsExecutionResult = {
        status: 'error',
        message: String(error && error.message ? error.message : error),
      }
    },
  )
})()`)

        const startTime = performance.now()
        while (true) {
          const result = await this.evaluate(`globalThis._____webContentsExecutionResult`)
          if (result?.status === 'resolved') {
            return result.value
          }
          if (result?.status === 'error') {
            throw new Error(result.message)
          }
          if (performance.now() - startTime > timeout) {
            throw new Error(`Timed out executing JavaScript in web contents ${webContentsId}`)
          }
          await new Promise((resolve) => setTimeout(resolve, 100))
        }
      } catch (error) {
        throw new VError(error, `Failed to execute JavaScript in web contents ${webContentsId}`)
      }
    },
    async waitForWebContentsText({ selector, text, timeout = 10_000, urlPattern }: { selector: string; text: string; timeout?: number; urlPattern: RegExp }) {
      try {
        const startTime = performance.now()
        while (true) {
          const entry = await this.waitForWebContentsView({
            timeout: Math.max(100, timeout - (performance.now() - startTime)),
            urlPattern,
          })
          const selectorText = await this.executeJavaScriptInWebContents({
            expression: `(() => {
  const element = document.querySelector(${JSON.stringify(selector)})
  return element ? element.textContent || '' : ''
})()`,
            timeout: Math.max(100, timeout - (performance.now() - startTime)),
            webContentsId: entry.id,
          })
          if (typeof selectorText === 'string' && selectorText.includes(text)) {
            return entry
          }
          if (performance.now() - startTime > timeout) {
            throw new Error(`Selector ${selector} in ${entry.url} did not contain expected text ${text}`)
          }
          await new Promise((resolve) => setTimeout(resolve, 100))
        }
      } catch (error) {
        throw new VError(error, `Failed to wait for web contents text ${text}`)
      }
    },
    async waitForWindowCount(expectedCount: number, timeout = 5000): Promise<void> {
      try {
        const startTime = performance.now()
        while (true) {
          const actualCount = await this.getWindowCount()
          if (actualCount === expectedCount) {
            return
          }
          if (performance.now() - startTime > timeout) {
            throw new Error(`Expected ${expectedCount} windows but got ${actualCount}`)
          }
          await new Promise((resolve) => setTimeout(resolve, 200))
        }
      } catch (error) {
        throw new VError(error, `Failed to wait for window count ${expectedCount}`)
      }
    },
    async getNewWindowId(): Promise<number | null> {
      try {
        await this.evaluate(`(() => {
          const { BrowserWindow } = globalThis._____electron
          const allWindows = BrowserWindow.getAllWindows()
          // Store the ID of the last window (the one just created)
          if (allWindows.length > 0) {
            globalThis._____newWindowId = allWindows[allWindows.length - 1].id
          } else {
            globalThis._____newWindowId = null
          }
        })()`)
        // Return the ID that was stored in the global
        return await this.evaluate(`globalThis._____newWindowId`)
      } catch (error) {
        throw new VError(error, `Failed to get new window ID`)
      }
    },
    async waitForWindowVisible(windowId: number) {
      try {
        const maxDelay = 5000
        const startTime = performance.now()
        while (true) {
          const isVisible = await this.getWindowIsVisible(windowId)
          if (isVisible) {
            return
          }
          if (performance.now() - startTime > maxDelay) {
            throw new Error(`Window ${windowId} did not become visible within ${maxDelay}ms`)
          }
          await new Promise((resolve) => setTimeout(resolve, 200))
        }
      } catch (error) {
        throw new VError(error, `Failed to wait for window visibility`)
      }
    },
    async closeWindow(windowId: number) {
      try {
        await this.evaluate(`(() => {
          const { BrowserWindow } = globalThis._____electron
          const window = BrowserWindow.fromId(${windowId})
          if (window && !window.isDestroyed()) {
            window.close()
          }
        })()`)
      } catch (error) {
        throw new VError(error, `Failed to close window`)
      }
    },
    async mockDialog(response: any) {
      try {
        const responseString = JSON.stringify(JSON.stringify(response))
        await this.mockElectron('dialog', 'showMessageBox', ` () => { return JSON.parse(${responseString}) }`)
        const that = this
        return {
          async [Symbol.asyncDispose]() {
            await that.unmockElectron('dialog', 'showMessageBox')
          },
        }
      } catch (error) {
        throw new VError(error, `Failed to mock electron dialog`)
      }
    },
    async mockElectron(namespace: string, key: string, implementationCode: string) {
      await this.evaluate(`(() => {
  const electron = globalThis._____electron
  globalThis['____electron_original_${namespace}'] = electron['${namespace}']['${key}']
  electron['${namespace}']['${key}'] = ${implementationCode}
})()`)
    },
    async mockOpenDialog(response: any) {
      try {
        const responseString = JSON.stringify(JSON.stringify(response))
        await this.mockElectron('dialog', 'showOpenDialog', `() => { return JSON.parse(${responseString}) }`)
      } catch (error) {
        throw new VError(error, `Failed to mock electron open dialog`)
      }
    },
    async mockSaveDialog(response: any) {
      try {
        const responseString = JSON.stringify(JSON.stringify(response))
        await this.mockElectron('dialog', 'showSaveDialog', `() => { return JSON.parse(${responseString}) }`)
      } catch (error) {
        throw new VError(error, `Failed to mock electron save dialog`)
      }
    },
    async mockShellTrashItem() {
      try {
        await this.mockElectron(
          'shell',
          'trashItem',
          `(path) => {
  const require = globalThis._____require
  const fs = require('fs')
  fs.rmSync(path)
}`,
        )
      } catch (error) {
        throw new VError(error, `Failed to mock electron shell trash item`)
      }
    },
    async unmockElectron(namespace: string, key: string) {
      await this.evaluate(`(() => {
  const electron = globalThis._____electron
  const original = globalThis['____electron_original_${namespace}']
  if(!original){
    throw new Error("original function not found")
  }
  electron['${namespace}']['${key}'] = original
})()`)
    },
  }
}
