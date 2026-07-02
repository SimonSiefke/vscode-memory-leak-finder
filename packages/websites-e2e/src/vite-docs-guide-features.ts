import type { TestContext } from '../types.js'

export const requiresNetwork = true

export const skip = true

const guideUrl = 'https://vite.dev/guide/'
const guideUrlPattern = /^https:\/\/vite\.dev\/guide\/?$/
const featuresUrlPattern = /^https:\/\/vite\.dev\/guide\/features\/?$/
const featuresLinkSelector = 'a[href="/guide/features"]'

export const setup = async ({ Editor, SimpleBrowser, Workspace, Notification, SideBar }: TestContext): Promise<void> => {
  await Workspace.setFiles([])
  await Editor.closeAll()
  await SideBar.hide()
  await Notification.closeAll({ force: true })
  await SimpleBrowser.show({
    url: guideUrl,
  })
  await SimpleBrowser.shouldHaveText({
    selector: 'h1',
    text: 'Getting Started',
    urlPattern: guideUrlPattern,
  })
}

export const run = async ({ SimpleBrowser }: TestContext): Promise<void> => {
  await SimpleBrowser.clickPageLink({
    headingText: 'Features',
    selector: featuresLinkSelector,
    urlPattern: featuresUrlPattern,
  })
  await SimpleBrowser.back({
    urlPattern: guideUrlPattern,
  })
  await SimpleBrowser.shouldHaveText({
    selector: 'h1',
    text: 'Getting Started',
    urlPattern: guideUrlPattern,
  })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
