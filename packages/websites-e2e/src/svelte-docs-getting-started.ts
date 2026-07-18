import type { TestContext } from '../types.js'

export const requiresNetwork = true

export const skip = true

const overviewUrl = 'https://svelte.dev/docs/svelte/overview'
const overviewUrlPattern = /^https:\/\/svelte\.dev\/docs\/svelte\/overview\/?$/
const gettingStartedUrlPattern = /^https:\/\/svelte\.dev\/docs\/svelte\/getting-started\/?$/
const gettingStartedLinkSelector = 'a[href="/docs/svelte/getting-started"]'

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
    text: 'Overview',
    urlPattern: overviewUrlPattern,
  })
}

export const run = async ({ SimpleBrowser }: TestContext): Promise<void> => {
  await SimpleBrowser.clickPageLink({
    headingText: 'Getting started',
    selector: gettingStartedLinkSelector,
    urlPattern: gettingStartedUrlPattern,
  })
  await SimpleBrowser.back({
    urlPattern: overviewUrlPattern,
  })
  await SimpleBrowser.shouldHaveText({
    selector: 'h1',
    text: 'Overview',
    urlPattern: overviewUrlPattern,
  })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
