import type { TestContext } from '../types.js'

export const requiresNetwork = true

export const skip = true

const gettingStartedUrl = 'https://vitest.dev/guide/'
const gettingStartedUrlPattern = /^https:\/\/vitest\.dev\/guide\/?$/
const featuresUrlPattern = /^https:\/\/vitest\.dev\/guide\/features(?:\.html)?\/?$/
const featuresLinkSelector = 'a[href="/guide/features"]'

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
    headingText: 'Features',
    selector: featuresLinkSelector,
    urlPattern: featuresUrlPattern,
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
