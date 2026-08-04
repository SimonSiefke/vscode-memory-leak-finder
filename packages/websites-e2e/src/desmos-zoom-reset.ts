import type { TestContext } from '../types.js'

export const requiresNetwork = true

export const skip = true

const url = 'https://www.desmos.com/calculator'
const urlPattern = /^https:\/\/www\.desmos\.com\/calculator\/?$/

const expression = `(async () => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const getButton = (label) => document.querySelector(\`button[aria-label="\${label}"]\`)
  const waitFor = async (callback, message) => {
    const start = Date.now()
    while (Date.now() - start < 10000) {
      const value = callback()
      if (value) return value
      await delay(100)
    }
    throw new Error(\`\${message}. url=\${location.href}; buttons=\${Array.from(document.querySelectorAll('button[aria-label]')).map((button) => button.getAttribute('aria-label')).filter(Boolean).slice(0, 30).join(' | ')}\`)
  }
  const zoomIn = await waitFor(() => getButton('Zoom In'), 'Expected Desmos Zoom In')
  zoomIn.click()
  const reset = await waitFor(() => getButton('Default Viewport'), 'Expected Desmos Default Viewport after zooming')
  reset.click()
  await waitFor(() => !getButton('Default Viewport'), 'Expected Desmos default viewport to be restored')
  const settings = await waitFor(() => getButton('Graph Settings'), 'Expected Desmos Graph Settings')
  settings.click()
  await waitFor(() => settings.getAttribute('aria-expanded') === 'true', 'Expected Desmos Graph Settings to open')
  settings.click()
  await waitFor(() => settings.getAttribute('aria-expanded') === 'false', 'Expected Desmos Graph Settings to close')
  const visibleExpressionInputs = Array.from(document.querySelectorAll('textarea')).filter((input) => input.getAttribute('aria-hidden') !== 'true')
  if (visibleExpressionInputs.some((input) => input.value !== '')) {
    throw new Error('Expected Desmos expression list to remain empty')
  }
})()`

export const setup = async ({ Editor, Notification, SideBar, SimpleBrowser, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([])
  await Editor.closeAll()
  await SideBar.hide()
  await Notification.closeAll({ force: true })
  await SimpleBrowser.show({ url })
  await SimpleBrowser.shouldHaveText({ text: 'Graph Settings', timeout: 20_000, urlPattern })
}

export const run = async ({ SimpleBrowser }: TestContext): Promise<void> => {
  await SimpleBrowser.executeJavaScript({ expression, timeout: 25_000 })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
