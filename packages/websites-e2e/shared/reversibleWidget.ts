import type { TestContext } from '../types.js'

export interface ReversibleWidgetConfig {
  readonly name: string
  readonly ready: string
  readonly reloadAfterRun?: boolean
  readonly run: string
  readonly url: string
}

interface ReversibleWidgetTest {
  readonly run: (context: TestContext) => Promise<void>
  readonly setup: (context: TestContext) => Promise<void>
  readonly teardown: (context: TestContext) => Promise<void>
}

export const createReversibleWidgetExpression = (config: ReversibleWidgetConfig, body: string): string => {
  const frameworkReady = config.name.startsWith('bootstrap-')
    ? `await waitFor(() => globalThis.bootstrap, 'Expected Bootstrap runtime')`
    : config.name.startsWith('jqueryui-')
      ? `await waitFor(() => globalThis.jQuery?.ui, 'Expected jQuery UI runtime')`
      : ''
  return `(async () => {
  const expectedUrl = new URL(${JSON.stringify(config.url)})
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const details = () => {
    const controls = Array.from(document.querySelectorAll('button, input, select, textarea, [role="button"], [role="tab"], [role="slider"]'))
      .filter((element) => element instanceof HTMLElement && element.offsetParent !== null)
      .slice(0, 12)
      .map((element) => (element.getAttribute('aria-label') || element.textContent || element.getAttribute('placeholder') || element.tagName).trim())
      .filter(Boolean)
      .join(' | ')
    return \`scenario=${config.name}; url=\${location.href}; title=\${document.title}; visibleControls=\${controls || '<none>'}\`
  }
  const waitFor = async (callback, message, timeout = 15000) => {
    const started = Date.now()
    while (Date.now() - started < timeout) {
      const value = callback()
      if (value) return value
      await delay(100)
    }
    throw new Error(\`\${message}. \${details()}\`)
  }
  const assert = (value, message) => {
    if (!value) throw new Error(\`\${message}. \${details()}\`)
  }
  const isReactReady = (element) => element && Object.keys(element).some((key) => key.startsWith('__reactProps$'))
  const findByText = (selector, text) => Array.from(document.querySelectorAll(selector)).find((element) => (element.textContent || '').trim() === text)
  const clickByText = (selector, text) => {
    const element = findByText(selector, text)
    assert(element instanceof HTMLElement, \`Expected \${selector} named \"\${text}\"\`)
    element.click()
    return element
  }
  const clickUntil = (element, predicate, message) => waitFor(() => {
    if (predicate()) return true
    element.click()
    return predicate()
  }, message)
  const consent = Array.from(document.querySelectorAll('button')).find((button) => /^(essential only|reject all|decline|allow analytics)$/i.test((button.textContent || '').trim()))
  consent?.click()
  assert(location.origin === expectedUrl.origin && location.pathname.replace(/\\/$/, '') === expectedUrl.pathname.replace(/\\/$/, ''), 'Expected original scenario URL')
  await waitFor(() => document.readyState === 'complete', 'Expected completed document load')
  ${frameworkReady}
  ${body}
})()`
}

export const createReversibleWidgetTest = (config: ReversibleWidgetConfig): ReversibleWidgetTest => {
  const readyExpression = createReversibleWidgetExpression(config, config.ready)
  const runExpression = createReversibleWidgetExpression(config, config.run)
  return {
    async setup({ Editor, Notification, SideBar, SimpleBrowser, Workspace }) {
      await Workspace.setFiles([])
      await Editor.closeAll()
      await SideBar.hide()
      await Notification.closeAll({ force: true })
      await SimpleBrowser.show({ url: config.url })
      await SimpleBrowser.executeJavaScript({ expression: readyExpression, timeout: 25_000 })
    },
    async run({ SimpleBrowser }) {
      await SimpleBrowser.executeJavaScript({ expression: runExpression, timeout: 30_000 })
      if (config.reloadAfterRun) {
        await SimpleBrowser.navigateIntegratedBrowser({ url: config.url, waitForContentFrame: true })
        await SimpleBrowser.executeJavaScript({ expression: readyExpression, timeout: 25_000 })
      }
    },
    async teardown({ Editor }) {
      await Editor.closeAll()
    },
  }
}
