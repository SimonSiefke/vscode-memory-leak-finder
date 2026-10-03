import type { TestContext } from '../types.js'

export const requiresNetwork = true

export const skip = true

interface WindowBounds {
  readonly height: number
  readonly width: number
  readonly x: number
  readonly y: number
}

const repositoryUrl = 'https://github.com/microsoft/vscode'
const repositoryUrlPattern = /https:\/\/github\.com\/microsoft\/vscode\/?(?:\n|$)/
const browserWidth = 1000
const browserHeight = 800

let originalWindowBounds: WindowBounds | undefined

const waitForMoreMenuExpression = `(async () => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const isVisible = (element) => {
    if (!element) {
      return false
    }
    const style = getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0
  }
  const start = Date.now()
  while (Date.now() - start < 10000) {
    const button = document.querySelector('nav[aria-label="Repository"] .js-responsive-underlinenav-overflow button')
    if (button instanceof HTMLButtonElement && isVisible(button)) {
      const labelledBy = button.getAttribute('aria-labelledby') || ''
      const label = labelledBy ? document.getElementById(labelledBy)?.textContent?.trim() || '' : ''
      if (label !== 'Additional navigation options') {
        throw new Error(\`Expected GitHub additional navigation button, got "\${label}"\`)
      }
      return
    }
    await delay(100)
  }
  throw new Error('Expected visible GitHub additional navigation button')
})()`

const toggleMoreMenuExpression = `(async () => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const waitFor = async (callback, message, timeout = 10000) => {
    const start = Date.now()
    while (Date.now() - start < timeout) {
      if (callback()) {
        return
      }
      await delay(100)
    }
    throw new Error(message)
  }
  const button = document.querySelector('nav[aria-label="Repository"] .js-responsive-underlinenav-overflow button')
  if (!(button instanceof HTMLButtonElement)) {
    throw new Error('Expected GitHub additional navigation button')
  }
  const overlayId = button.getAttribute('popovertarget') || ''
  const overlay = document.getElementById(overlayId)
  if (!(overlay instanceof HTMLElement)) {
    throw new Error('Expected GitHub additional navigation popover')
  }
  if (overlay.matches(':popover-open')) {
    button.click()
    await waitFor(() => !overlay.matches(':popover-open'), 'Expected GitHub additional navigation popover to close')
  }
  button.click()
  await waitFor(() => {
    return overlay.matches(':popover-open') && Boolean(overlay.querySelector('[role="menuitem"]:not([tabindex="-1"])'))
  }, 'Expected GitHub additional navigation popover to open')
  button.click()
  await waitFor(() => !overlay.matches(':popover-open'), 'Expected GitHub additional navigation popover to close')
})()`

const getWindowExpression = (body: string): string => {
  return `(() => {
  const { BrowserWindow } = globalThis._____electron
  const window = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows().find((candidate) => candidate.isVisible())
  if (!window || window.isDestroyed()) {
    throw new Error('Expected visible VS Code window')
  }
  ${body}
})()`
}

export const setup = async ({ Editor, Electron, Notification, SideBar, SimpleBrowser, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([])
  await Editor.closeAll()
  await SideBar.hide()
  await Notification.closeAll({ force: true })
  await SimpleBrowser.show({
    url: repositoryUrl,
  })
  await SimpleBrowser.shouldHaveText({
    selector: 'main h1',
    text: 'microsoft/vscode',
    urlPattern: repositoryUrlPattern,
  })
  originalWindowBounds = (await Electron.evaluate(
    getWindowExpression(`const bounds = window.getBounds()
  window.setBounds({
    ...bounds,
    height: ${browserHeight},
    width: ${browserWidth},
  })
  return bounds`),
  )) as unknown as WindowBounds
  await SimpleBrowser.executeJavaScript({
    expression: waitForMoreMenuExpression,
  })
}

export const run = async ({ SimpleBrowser }: TestContext): Promise<void> => {
  await SimpleBrowser.executeJavaScript({
    expression: toggleMoreMenuExpression,
  })
}

export const teardown = async ({ Editor, Electron }: TestContext): Promise<void> => {
  try {
    await Editor.closeAll()
  } finally {
    try {
      if (originalWindowBounds) {
        await Electron.evaluate(getWindowExpression(`window.setBounds(${JSON.stringify(originalWindowBounds)})`))
      }
    } finally {
      originalWindowBounds = undefined
    }
  }
}
