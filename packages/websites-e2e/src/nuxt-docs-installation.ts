import type { TestContext } from '../types.js'

export const requiresNetwork = true

export const skip = true

const introductionUrl = 'https://nuxt.com/docs/getting-started/introduction'
const introductionUrlPattern = /^https:\/\/nuxt\.com\/docs\/(?:\d+\.x\/)?getting-started\/introduction\/?$/
const installationUrlPattern = /^https:\/\/nuxt\.com\/docs\/(?:\d+\.x\/)?getting-started\/installation\/?$/
const installationLinkSelector = 'a[href$="/getting-started/installation"]'

export const setup = async ({ Editor, SimpleBrowser, Workspace, Notification, SideBar }: TestContext): Promise<void> => {
  await Workspace.setFiles([])
  await Editor.closeAll()
  await SideBar.hide()
  await Notification.closeAll({ force: true })
  await SimpleBrowser.show({
    url: introductionUrl,
  })
  await SimpleBrowser.shouldHaveText({
    selector: 'h1',
    text: 'Introduction',
    urlPattern: introductionUrlPattern,
  })
}

export const run = async ({ SimpleBrowser }: TestContext): Promise<void> => {
  await SimpleBrowser.clickPageLink({
    headingText: 'Installation',
    selector: installationLinkSelector,
    urlPattern: installationUrlPattern,
  })
  await SimpleBrowser.back({
    urlPattern: introductionUrlPattern,
  })
  await SimpleBrowser.shouldHaveText({
    selector: 'h1',
    text: 'Introduction',
    urlPattern: introductionUrlPattern,
  })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
