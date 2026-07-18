import type { TestContext } from '../types.js'

export const requiresNetwork = true

export const skip = true

const docsUrl = 'https://www.prisma.io/docs'
const docsUrlPattern = /^https:\/\/www\.prisma\.io\/docs\/?$/
const gettingStartedUrlPattern = /^https:\/\/www\.prisma\.io\/docs\/getting-started\/?$/
const gettingStartedLinkSelector = 'a[href="/docs/getting-started"]'

export const setup = async ({ Editor, SimpleBrowser, Workspace, Notification, SideBar }: TestContext): Promise<void> => {
  await Workspace.setFiles([])
  await Editor.closeAll()
  await SideBar.hide()
  await Notification.closeAll({ force: true })
  await SimpleBrowser.show({
    url: docsUrl,
  })
  await SimpleBrowser.shouldHaveText({
    selector: 'h1',
    text: 'Introduction to Prisma',
    urlPattern: docsUrlPattern,
  })
}

export const run = async ({ SimpleBrowser }: TestContext): Promise<void> => {
  await SimpleBrowser.clickPageLink({
    headingText: 'Choose a setup path',
    selector: gettingStartedLinkSelector,
    urlPattern: gettingStartedUrlPattern,
  })
  await SimpleBrowser.back({
    urlPattern: docsUrlPattern,
  })
  await SimpleBrowser.shouldHaveText({
    selector: 'h1',
    text: 'Introduction to Prisma',
    urlPattern: docsUrlPattern,
  })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
