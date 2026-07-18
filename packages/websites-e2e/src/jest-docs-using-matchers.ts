import type { TestContext } from '../types.js'

export const requiresNetwork = true

export const skip = true

const gettingStartedUrl = 'https://jestjs.io/docs/getting-started'
const gettingStartedUrlPattern = /^https:\/\/jestjs\.io\/docs\/getting-started\/?$/
const usingMatchersUrlPattern = /^https:\/\/jestjs\.io\/docs\/using-matchers\/?$/
const usingMatchersLinkSelector = 'a[href="/docs/using-matchers"]'

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
    text: 'Getting Started',
    urlPattern: gettingStartedUrlPattern,
  })
}

export const run = async ({ SimpleBrowser }: TestContext): Promise<void> => {
  await SimpleBrowser.clickPageLink({
    headingText: 'Using Matchers',
    selector: usingMatchersLinkSelector,
    urlPattern: usingMatchersUrlPattern,
  })
  await SimpleBrowser.back({
    urlPattern: gettingStartedUrlPattern,
  })
  await SimpleBrowser.shouldHaveText({
    selector: 'h1',
    text: 'Getting Started',
    urlPattern: gettingStartedUrlPattern,
  })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
