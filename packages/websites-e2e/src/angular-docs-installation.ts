import type { TestContext } from '../types.js'

export const requiresNetwork = true

export const skip = true

const overviewUrl = 'https://angular.dev/overview'
const overviewUrlPattern = /^https:\/\/angular\.dev\/overview\/?$/
const installationUrlPattern = /^https:\/\/angular\.dev\/installation\/?$/
const installationLinkSelector = 'a[href="/installation"]'

export const setup = async ({ Editor, SimpleBrowser, Workspace, Notification, SideBar }: TestContext): Promise<void> => {
  await Workspace.setFiles([])
  await Editor.closeAll()
  await SideBar.hide()
  await Notification.closeAll({ force: true })
  await SimpleBrowser.show({
    url: overviewUrl,
  })
  await SimpleBrowser.shouldHaveText({
    selector: 'h1',
    text: 'What is Angular?',
    urlPattern: overviewUrlPattern,
  })
}

export const run = async ({ SimpleBrowser }: TestContext): Promise<void> => {
  await SimpleBrowser.clickPageLink({
    headingText: 'Installation',
    selector: installationLinkSelector,
    urlPattern: installationUrlPattern,
  })
  await SimpleBrowser.back({
    urlPattern: overviewUrlPattern,
  })
  await SimpleBrowser.shouldHaveText({
    selector: 'h1',
    text: 'What is Angular?',
    urlPattern: overviewUrlPattern,
  })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
