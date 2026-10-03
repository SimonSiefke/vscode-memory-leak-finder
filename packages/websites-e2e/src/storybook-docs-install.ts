import type { TestContext } from '../types.js'

export const requiresNetwork = true

export const skip = true

const docsUrl = 'https://storybook.js.org/docs'
const docsUrlPattern = /^https:\/\/storybook\.js\.org\/docs\/?$/
const installUrlPattern = /^https:\/\/storybook\.js\.org\/docs\/get-started\/install\/?$/
const installLinkSelector = 'a[href="/docs/get-started/install"]'

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
    text: 'Get started with Storybook',
    urlPattern: docsUrlPattern,
  })
}

export const run = async ({ SimpleBrowser }: TestContext): Promise<void> => {
  await SimpleBrowser.clickPageLink({
    headingText: 'Install Storybook',
    selector: installLinkSelector,
    urlPattern: installUrlPattern,
  })
  await SimpleBrowser.back({
    urlPattern: docsUrlPattern,
  })
  await SimpleBrowser.shouldHaveText({
    selector: 'h1',
    text: 'Get started with Storybook',
    urlPattern: docsUrlPattern,
  })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
