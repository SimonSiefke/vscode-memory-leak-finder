import type { TestContext } from '../types.js'

export const requiresNetwork = true

export const skip = true

const issuesUrl = 'https://github.com/microsoft/vscode/issues?q=is%3Aissue%20state%3Aopen'
const issuesUrlPattern = /https:\/\/github\.com\/microsoft\/vscode\/issues\?q=is%3Aissue(?:%20|\+)state%3Aopen(?:\n|$)/
const assignedToMeUrlPattern = /https:\/\/github\.com\/microsoft\/vscode\/issues\?q=.*assignee%3A%40me(?:\n|$)/
const assignedToMeSelector = 'nav[aria-label="Issue filters"] a[href*="assignee%3A%40me"]'
const allIssuesSelector = 'nav[aria-label="Issue filters"] a[href="/microsoft/vscode/issues?q=is%3Aissue+state%3Aopen"]'

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
  // Establish a rendered history entry because signed-out @me navigation replaces GitHub's initial route.
  await SimpleBrowser.clickPageLink({
    selector: allIssuesSelector,
    urlPattern: issuesUrlPattern,
  })
  await SimpleBrowser.clickPageLink({
    selector: assignedToMeSelector,
    urlPattern: assignedToMeUrlPattern,
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
