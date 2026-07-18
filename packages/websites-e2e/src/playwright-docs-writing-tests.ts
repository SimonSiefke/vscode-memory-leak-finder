import type { TestContext } from '../types.js'

export const requiresNetwork = true

export const skip = true

const installationUrl = 'https://playwright.dev/docs/intro'
const installationUrlPattern = /^https:\/\/playwright\.dev\/docs\/intro\/?$/
const writingTestsUrlPattern = /^https:\/\/playwright\.dev\/docs\/writing-tests\/?$/
const writingTestsLinkSelector = 'a[href="/docs/writing-tests"]'

export const setup = async ({ Editor, SimpleBrowser, Workspace, Notification, SideBar }: TestContext): Promise<void> => {
  await Workspace.setFiles([])
  await Editor.closeAll()
  await SideBar.hide()
  await Notification.closeAll({ force: true })
  await SimpleBrowser.show({
    url: installationUrl,
  })
  await SimpleBrowser.shouldHaveText({
    selector: 'h1',
    text: 'Installation',
    urlPattern: installationUrlPattern,
  })
}

export const run = async ({ SimpleBrowser }: TestContext): Promise<void> => {
  await SimpleBrowser.clickPageLink({
    headingText: 'Writing tests',
    selector: writingTestsLinkSelector,
    urlPattern: writingTestsUrlPattern,
  })
  await SimpleBrowser.back({
    urlPattern: installationUrlPattern,
  })
  await SimpleBrowser.shouldHaveText({
    selector: 'h1',
    text: 'Installation',
    urlPattern: installationUrlPattern,
  })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
