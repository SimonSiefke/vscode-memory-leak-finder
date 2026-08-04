import type { TestContext } from '../types.js'

export const requiresNetwork = true

export const skip = true

const issuesUrl = 'https://github.com/microsoft/vscode/issues'
const issuesUrlPattern = /https:\/\/github\.com\/microsoft\/vscode\/issues(?:\?.*)?(?:\n|$)/
const baselineQuery = 'is:issue state:open label:bug'
const alternateQuery = 'is:issue state:open label:feature-request'

const getSearchIssuesExpression = (query: string): string => {
  return `(async () => {
  const query = ${JSON.stringify(query)}
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const waitForPageIdle = async () => {
    await new Promise((resolve) => {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(resolve, { timeout: 1500 })
      } else {
        setTimeout(resolve, 500)
      }
    })
    await delay(250)
  }
  const waitFor = async (callback, message, timeout = 30000) => {
    const start = Date.now()
    while (Date.now() - start < timeout) {
      if (callback()) {
        return
      }
      await delay(100)
    }
    throw new Error(message)
  }
  const getSearchInput = () => {
    return document.querySelector('input[name="repository-inputname"]')
  }
  const getButtonLabel = (button) => {
    const ariaLabel = button.getAttribute('aria-label') || ''
    const labelledBy = button.getAttribute('aria-labelledby') || ''
    const labelledText = labelledBy ? document.getElementById(labelledBy)?.textContent || '' : ''
    return [ariaLabel, labelledText].join(' ').trim()
  }
  await waitForPageIdle()
  const input = getSearchInput()
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('Expected GitHub issues search input')
  }
  input.focus()
  input.select()
  if (!document.execCommand('insertText', false, query) || input.value !== query) {
    throw new Error(\`Expected GitHub issues search query "\${query}", got "\${input.value}"\`)
  }
  const searchButton = Array.from(document.querySelectorAll('button')).find((button) => /^search$/i.test(getButtonLabel(button)))
  if (!(searchButton instanceof HTMLButtonElement)) {
    throw new Error('Expected GitHub issues search button')
  }
  searchButton.click()
  await waitForPageIdle()
  await waitFor(() => {
    const currentInput = getSearchInput()
    const progress = document.querySelector('[data-testid="list-load-progress-bar"]')
    const hasResults = Boolean(document.querySelector('section[aria-label="All issues"] li[role="listitem"]'))
    const queryMatches = new URLSearchParams(location.search).get('q') === query
    const inputMatches = currentInput instanceof HTMLInputElement && currentInput.value === query
    const progressComplete = !progress || progress.getBoundingClientRect().width === 0
    return location.pathname === '/microsoft/vscode/issues' && queryMatches && inputMatches && hasResults && progressComplete
  }, \`GitHub issues search did not settle for "\${query}". url=\${location.href}\`)
})()`
}

const searchIssues = async (SimpleBrowser: TestContext['SimpleBrowser'], query: string): Promise<void> => {
  await SimpleBrowser.executeJavaScript({
    expression: getSearchIssuesExpression(query),
    timeout: 40_000,
  })
}

export const setup = async ({ Editor, Notification, SideBar, SimpleBrowser, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([])
  await Editor.closeAll()
  await SideBar.hide()
  await Notification.closeAll({ force: true })
  await SimpleBrowser.show({
    url: issuesUrl,
  })
  await SimpleBrowser.shouldHaveText({
    selector: 'main h1',
    text: 'All issues',
    urlPattern: issuesUrlPattern,
  })
  await searchIssues(SimpleBrowser, baselineQuery)
}

export const run = async ({ SimpleBrowser }: TestContext): Promise<void> => {
  await searchIssues(SimpleBrowser, alternateQuery)
  await searchIssues(SimpleBrowser, baselineQuery)
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
