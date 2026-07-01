import type { TestContext } from '../types.js'

export const requiresNetwork = true

export const skip = true

const installationUrl = 'https://reactrouter.com/start/framework/installation'
const installationUrlPattern = /^https:\/\/reactrouter\.com\/start\/framework\/installation\/?$/
const routingUrlPattern = /^https:\/\/reactrouter\.com\/start\/framework\/routing\/?$/
const routingLinkSelector = 'a[href="/start/framework/routing"]'

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
    headingText: 'Routing',
    selector: routingLinkSelector,
    urlPattern: routingUrlPattern,
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
