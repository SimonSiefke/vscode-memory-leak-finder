import type { TestContext } from '../types.js'

export const requiresNetwork = true

export const skip = true

const url = 'https://jupyterlite.github.io/demo/repl/index.html?kernel=python&toolbar=1'
const urlPattern = /^https:\/\/jupyterlite\.github\.io\/demo\/repl\/index\.html\?kernel=python&toolbar=1$/

const runExpression = `(async () => {
  const code = 'sum(range(1000))'
  const expected = '499500'
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
    throw new Error(\`${message}. url=\${location.href}; body=\${(document.body.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 500)}\`)
  }
  const prompt = await waitFor(() => {
    const candidates = Array.from(document.querySelectorAll('[contenteditable="true"], textarea'))
    return candidates.find((candidate) => isVisible(candidate) && !(candidate.textContent || candidate.value || '').trim())
  }, 'Expected blank JupyterLite prompt')
  prompt.focus()
  if (!document.execCommand('insertText', false, code)) {
    throw new Error('Expected JupyterLite prompt text insertion')
  }
  const runButton = await waitFor(() => document.querySelector('button[aria-label^="Run Cell"]'), 'Expected JupyterLite Run Cell control')
  runButton.click()
  await waitFor(() => (document.body.textContent || '').includes(expected), 'Expected JupyterLite result 499500', 60000)
  const clearButton = await waitFor(() => document.querySelector('button[aria-label="Clear Console Cells"]'), 'Expected JupyterLite Clear Console Cells control')
  clearButton.click()
  await waitFor(() => !(document.body.textContent || '').includes(expected), 'Expected JupyterLite console cells to clear')
})()`

const readyExpression = `(async () => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const start = Date.now()
  while (Date.now() - start < 30000) {
    if (document.querySelector('button[aria-label^="Run Cell"]') && document.querySelector('button[aria-label="Clear Console Cells"]')) return
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
  await SimpleBrowser.executeJavaScript({ expression: runExpression, timeout: 70_000 })
  await SimpleBrowser.navigateIntegratedBrowser({ url, waitForContentFrame: true })
  await SimpleBrowser.shouldHaveText({ text: 'Powered by JupyterLite', timeout: 30_000, urlPattern })
  await SimpleBrowser.executeJavaScript({ expression: readyExpression, timeout: 35_000 })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
