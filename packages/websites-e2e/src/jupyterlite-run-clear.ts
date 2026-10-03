import type { TestContext } from '../types.js'

export const requiresNetwork = true

export const skip = true

const url = 'https://jupyterlite.github.io/demo/repl/index.html?kernel=python&toolbar=1'

const inputExpression = `(async () => {
  const code = 'sum(range(1000))'
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const isVisible = (element) => {
    if (!element) return false
    const style = getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0
  }
  const waitFor = async (callback, message, timeout = 30000) => {
    const start = Date.now()
    while (Date.now() - start < timeout) {
      const value = callback()
      if (value) return value
      await delay(100)
    }
    throw new Error(\`\${message}. url=\${location.href}; body=\${(document.body.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 500)}\`)
  }
  const prompt = await waitFor(() => {
    const candidates = Array.from(document.querySelectorAll('[contenteditable="true"], textarea'))
    return candidates.find((candidate) => isVisible(candidate) && !(candidate.textContent || candidate.value || '').trim())
  }, 'Expected blank JupyterLite prompt')
  prompt.focus()
  if (!document.execCommand('insertText', false, code)) {
    throw new Error('Expected JupyterLite prompt text insertion')
  }
})()`

const getResultExpression = (expectedPresent: boolean): string => `(async () => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const start = Date.now()
  while (Date.now() - start < ${expectedPresent ? 90_000 : 30_000}) {
    const hasResult = (document.body.textContent || '').includes('499500')
    if (hasResult === ${expectedPresent}) return
    await delay(100)
  }
  throw new Error(\`${expectedPresent ? 'Expected JupyterLite result 499500' : 'Expected JupyterLite console cells to clear'}. url=\${location.href}; body=\${(document.body.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 500)}\`)
})()`

const resultExpression = getResultExpression(true)
const clearedExpression = getResultExpression(false)

const readyExpression = `(async () => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const start = Date.now()
  while (Date.now() - start < 30000) {
    const blankPrompt = Array.from(document.querySelectorAll('[contenteditable="true"], textarea')).some((candidate) => {
      const style = getComputedStyle(candidate)
      const rect = candidate.getBoundingClientRect()
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0 && !(candidate.textContent || candidate.value || '').trim()
    })
    if (location.origin === 'https://jupyterlite.github.io' && location.pathname === '/demo/repl/index.html' && document.querySelector('[aria-label^="Run Cell"]') && document.querySelector('[aria-label="Clear Console Cells"]') && blankPrompt && !(document.body.textContent || '').includes('499500')) return
    await delay(100)
  }
  throw new Error(\`Timed out waiting for JupyterLite REPL. url=\${location.href}\`)
})()`

export const setup = async ({ Editor, Notification, SideBar, SimpleBrowser, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([])
  await Editor.closeAll()
  await SideBar.hide()
  await Notification.closeAll({ force: true })
  await SimpleBrowser.show({ url })
  await SimpleBrowser.executeJavaScript({ expression: readyExpression, timeout: 35_000 })
}

export const run = async ({ SimpleBrowser }: TestContext): Promise<void> => {
  await SimpleBrowser.executeJavaScript({ expression: inputExpression, timeout: 35_000 })
  await SimpleBrowser.dragBrowserWebContents({ deltaX: 0, deltaY: 0, selector: '[aria-label^="Run Cell"]' })
  await SimpleBrowser.executeJavaScript({ expression: resultExpression, timeout: 95_000 })
  await SimpleBrowser.dragBrowserWebContents({ deltaX: 0, deltaY: 0, selector: '[aria-label="Clear Console Cells"]' })
  await SimpleBrowser.executeJavaScript({ expression: clearedExpression, timeout: 35_000 })
  await SimpleBrowser.navigateIntegratedBrowser({ url, waitForContentFrame: true })
  await SimpleBrowser.executeJavaScript({ expression: readyExpression, timeout: 35_000 })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
