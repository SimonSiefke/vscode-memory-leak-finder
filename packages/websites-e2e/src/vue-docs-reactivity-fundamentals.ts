import type { TestContext } from '../types.js'

export const requiresNetwork = true

export const skip = true

const introductionUrl = 'https://vuejs.org/guide/introduction'
const introductionUrlPattern = /^https:\/\/vuejs\.org\/guide\/introduction\/?$/
const tutorialUrlPattern = /^https:\/\/vuejs\.org\/tutorial\/?$/
const tutorialLinkSelector = 'a[href="/tutorial/"]'

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
    selector: tutorialLinkSelector,
    urlPattern: tutorialUrlPattern,
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
