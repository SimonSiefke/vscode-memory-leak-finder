import type { TestContext } from '../types.js'

export const requiresNetwork = true

export const skip = true

const repositoryUrl = 'https://github.com/microsoft/vscode'
const repositoryUrlPattern = /https:\/\/github\.com\/microsoft\/vscode\/?(?:\n|$)/
const issuesUrlPattern = /https:\/\/github\.com\/microsoft\/vscode\/issues\/?(?:\n|$)/
const selectedCodeTabSelector = '#code-tab[aria-current="page"]'

export const setup = async ({ Editor, Notification, SideBar, SimpleBrowser, Workspace }: TestContext): Promise<void> => {
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
}

export const run = async ({ SimpleBrowser }: TestContext): Promise<void> => {
  await SimpleBrowser.clickPageLink({
    selector: '#issues-tab',
    urlPattern: issuesUrlPattern,
  })
  await SimpleBrowser.shouldHaveText({
    selector: 'main h1',
    text: 'All issues',
    urlPattern: issuesUrlPattern,
  })
  await SimpleBrowser.back({
    urlPattern: repositoryUrlPattern,
  })
  await SimpleBrowser.shouldHaveText({
    selector: selectedCodeTabSelector,
    text: 'Code',
    urlPattern: repositoryUrlPattern,
  })
  await SimpleBrowser.forward({
    urlPattern: issuesUrlPattern,
  })
  await SimpleBrowser.shouldHaveText({
    selector: 'main h1',
    text: 'All issues',
    urlPattern: issuesUrlPattern,
  })
  await SimpleBrowser.back({
    urlPattern: repositoryUrlPattern,
  })
  await SimpleBrowser.shouldHaveText({
    selector: selectedCodeTabSelector,
    text: 'Code',
    urlPattern: repositoryUrlPattern,
  })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
