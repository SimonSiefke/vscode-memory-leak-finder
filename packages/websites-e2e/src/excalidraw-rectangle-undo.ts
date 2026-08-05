import type { TestContext } from '../types.js'

export const requiresNetwork = true

export const skip = true

const url = 'https://excalidraw.com/'
const urlPattern = /^https:\/\/excalidraw\.com\/?$/

const selectRectangleExpression = `(async () => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const getButton = (label) => document.querySelector(\`button[aria-label="\${label}"]\`)
  const waitFor = async (callback, message) => {
    const start = Date.now()
    while (Date.now() - start < 10000) {
      const value = callback()
      if (value) return value
      await delay(100)
    }
    throw new Error(\`\${message}. url=\${location.href}\`)
  }
  const rectangle = await waitFor(() => getButton('Rectangle'), 'Expected Excalidraw rectangle tool')
  await waitFor(() => document.querySelector('canvas.excalidraw__canvas.interactive'), 'Expected Excalidraw interactive canvas')
  rectangle.click()
})()`

const undoExpression = `(async () => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const getButton = (label) => document.querySelector(\`button[aria-label="\${label}"]\`)
  const waitFor = async (callback, message) => {
    const start = Date.now()
    while (Date.now() - start < 10000) {
      const value = callback()
      if (value) return value
      await delay(100)
    }
    throw new Error(\`\${message}. url=\${location.href}\`)
  }
  const undo = await waitFor(() => {
    const candidate = getButton('Undo')
    return candidate && !candidate.disabled ? candidate : undefined
  }, 'Expected Excalidraw Undo to become enabled')
  undo.click()
  await waitFor(() => {
    const candidate = getButton('Redo')
    return candidate && !candidate.disabled
  }, 'Expected Excalidraw Redo after undoing the rectangle')
})()`

const emptyExpression = `(async () => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const start = Date.now()
  while (Date.now() - start < 15000) {
    const canvas = document.querySelector('canvas.excalidraw__canvas.interactive')
    const undo = document.querySelector('button[aria-label="Undo"]')
    if (canvas && undo instanceof HTMLButtonElement && undo.disabled) return
    await delay(100)
  }
  throw new Error(\`Expected a fresh empty Excalidraw canvas after reload. url=\${location.href}\`)
})()`

export const setup = async ({ Editor, Notification, SideBar, SimpleBrowser, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([])
  await Editor.closeAll()
  await SideBar.hide()
  await Notification.closeAll({ force: true })
  await SimpleBrowser.show({ url })
  await SimpleBrowser.executeJavaScript({ expression: emptyExpression, timeout: 20_000 })
}

export const run = async ({ SimpleBrowser }: TestContext): Promise<void> => {
  await SimpleBrowser.executeJavaScript({ expression: selectRectangleExpression, timeout: 20_000 })
  await SimpleBrowser.dragBrowserWebContents({
    deltaX: 100,
    deltaY: 80,
    selector: 'canvas.excalidraw__canvas.interactive',
  })
  await SimpleBrowser.executeJavaScript({ expression: undoExpression, timeout: 20_000 })
  await SimpleBrowser.navigateIntegratedBrowser({ url, waitForContentFrame: true })
  await SimpleBrowser.shouldHaveText({ selector: 'h1', text: 'Excalidraw', timeout: 20_000, urlPattern })
  await SimpleBrowser.executeJavaScript({ expression: emptyExpression, timeout: 20_000 })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
