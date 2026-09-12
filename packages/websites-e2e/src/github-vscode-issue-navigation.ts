import type { TestContext } from '../types.js'

export const requiresNetwork = true

export const skip = true

const issuesUrl = 'https://github.com/microsoft/vscode/issues'
const issuesUrlPattern = /https:\/\/github\.com\/microsoft\/vscode\/issues\/?(?:\n|$)/
const issueUrlPattern = /https:\/\/github\.com\/microsoft\/vscode\/issues\/\d+\/?(?:\n|$)/
const issueLinkSelector = 'section[aria-label="All issues"] li[role="listitem"] h3 a[href^="/microsoft/vscode/issues/"]'

const waitForIssueHeadingExpression = `(async () => {
  const start = Date.now()
  while (Date.now() - start < 10000) {
    const heading = document.querySelector('main h1')
    if (heading?.textContent?.trim()) {
      return
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error('Expected GitHub issue heading')
})()`

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
}

export const run = async ({ SimpleBrowser }: TestContext): Promise<void> => {
  await SimpleBrowser.clickPageLink({
    selector: issueLinkSelector,
    urlPattern: issueUrlPattern,
  })
  await SimpleBrowser.executeJavaScript({
    expression: waitForIssueHeadingExpression,
  })
  await SimpleBrowser.back({
    urlPattern: issuesUrlPattern,
  })
  await SimpleBrowser.shouldHaveText({
    selector: 'main h1',
    text: 'All issues',
    urlPattern: issuesUrlPattern,
  })
  await SimpleBrowser.forward({
    urlPattern: issueUrlPattern,
  })
  await SimpleBrowser.executeJavaScript({
    expression: waitForIssueHeadingExpression,
  })
  await SimpleBrowser.back({
    urlPattern: issuesUrlPattern,
  })
  await SimpleBrowser.shouldHaveText({
    selector: 'main h1',
    text: 'All issues',
    urlPattern: issuesUrlPattern,
  })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
