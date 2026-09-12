import type { TestContext } from '../types.js'

export const requiresNetwork = true

export const skip = true

const url = 'https://www.desmos.com/calculator'

const readyExpression = `(async () => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const start = Date.now()
  while (Date.now() - start < 15000) {
    if (location.origin === 'https://www.desmos.com' && location.pathname.replace(/\\/$/, '') === '/calculator' && document.querySelector('[aria-label="Graph Settings"]') && document.querySelector('[aria-label="Zoom In"]')) return
    await delay(100)
  }
  throw new Error(\`Expected Desmos graph controls. url=\${location.href}; labels=\${Array.from(document.querySelectorAll('[aria-label]')).map((element) => element.getAttribute('aria-label')).filter(Boolean).slice(0, 40).join(' | ')}\`)
})()`

const getStateExpression = (condition: string, message: string, verifyEmptyExpressions = false): string => `(async () => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const getControl = (label) => document.querySelector(\`[aria-label="\${label}"]\`)
  const start = Date.now()
  while (Date.now() - start < 10000) {
    if (${condition}) {
      ${
        verifyEmptyExpressions
          ? `
      const visibleExpressionInputs = Array.from(document.querySelectorAll('textarea')).filter((input) => input.getAttribute('aria-hidden') !== 'true')
      if (visibleExpressionInputs.some((input) => input.value !== '')) {
        throw new Error('Expected Desmos expression list to remain empty')
      }`
          : ''
      }
      return
    }
    await delay(100)
  }
  throw new Error(${JSON.stringify(message)} + \`. url=\${location.href}; labels=\${Array.from(document.querySelectorAll('[aria-label]')).map((element) => element.getAttribute('aria-label')).filter(Boolean).slice(0, 40).join(' | ')}\`)
})()`

const zoomedExpression = getStateExpression(`getControl('Default Viewport')`, 'Expected Desmos Default Viewport after zooming')
const resetExpression = getStateExpression(`!getControl('Default Viewport')`, 'Expected Desmos default viewport to be restored')
const settingsOpenExpression = getStateExpression(
  `getControl('Graph Settings')?.getAttribute('aria-expanded') === 'true'`,
  'Expected Desmos Graph Settings to open',
)
const settingsClosedExpression = getStateExpression(
  `getControl('Graph Settings')?.getAttribute('aria-expanded') === 'false'`,
  'Expected Desmos Graph Settings to close',
  true,
)

export const setup = async ({ Editor, Notification, SideBar, SimpleBrowser, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([])
  await Editor.closeAll()
  await SideBar.hide()
  await Notification.closeAll({ force: true })
  await SimpleBrowser.show({ url })
  await SimpleBrowser.executeJavaScript({ expression: readyExpression, timeout: 20_000 })
}

export const run = async ({ SimpleBrowser }: TestContext): Promise<void> => {
  await SimpleBrowser.dragBrowserWebContents({ deltaX: 0, deltaY: 0, selector: '[aria-label="Zoom In"]' })
  await SimpleBrowser.executeJavaScript({ expression: zoomedExpression, timeout: 15_000 })
  await SimpleBrowser.dragBrowserWebContents({ deltaX: 0, deltaY: 0, selector: '[aria-label="Default Viewport"]' })
  await SimpleBrowser.executeJavaScript({ expression: resetExpression, timeout: 15_000 })
  await SimpleBrowser.dragBrowserWebContents({ deltaX: 0, deltaY: 0, selector: '[aria-label="Graph Settings"]' })
  await SimpleBrowser.executeJavaScript({ expression: settingsOpenExpression, timeout: 15_000 })
  await SimpleBrowser.dragBrowserWebContents({ deltaX: 0, deltaY: 0, selector: '[aria-label="Graph Settings"]' })
  await SimpleBrowser.executeJavaScript({ expression: settingsClosedExpression, timeout: 15_000 })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
