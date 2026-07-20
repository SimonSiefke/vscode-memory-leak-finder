import type { TestContext } from '../types.js'

export const requiresNetwork = true

export const skip = true

const gettingStartedUrl = 'https://redux.js.org/introduction/getting-started'
const gettingStartedUrlPattern = /^https:\/\/redux\.js\.org\/introduction\/getting-started\/?$/
const installationUrlPattern = /^https:\/\/redux\.js\.org\/introduction\/installation\/?$/
const installationLinkSelector = 'a[href="/introduction/installation"]'

export const setup = async ({ Editor, SimpleBrowser, Workspace, Notification, SideBar }: TestContext): Promise<void> => {
  await Workspace.setFiles([])
  await Editor.closeAll()
  await SideBar.hide()
  await Notification.closeAll({ force: true })
  await SimpleBrowser.show({
    url: gettingStartedUrl,
  })
  await SimpleBrowser.shouldHaveText({
    selector: 'h1',
    text: 'Getting Started with Redux',
    urlPattern: gettingStartedUrlPattern,
  })
}

export const run = async ({ SimpleBrowser }: TestContext): Promise<void> => {
  await SimpleBrowser.clickPageLink({
    headingText: 'Installation',
    selector: installationLinkSelector,
    urlPattern: installationUrlPattern,
  })
  await SimpleBrowser.back({
    urlPattern: gettingStartedUrlPattern,
  })
  await SimpleBrowser.shouldHaveText({
    selector: 'h1',
    text: 'Getting Started with Redux',
    urlPattern: gettingStartedUrlPattern,
  })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
