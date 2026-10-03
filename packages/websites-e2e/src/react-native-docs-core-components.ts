import type { TestContext } from '../types.js'

export const requiresNetwork = true

export const skip = true

const introductionUrl = 'https://reactnative.dev/docs/getting-started'
const introductionUrlPattern = /^https:\/\/reactnative\.dev\/docs\/getting-started\/?$/
const coreComponentsUrlPattern = /^https:\/\/reactnative\.dev\/docs\/intro-react-native-components\/?$/
const coreComponentsLinkSelector = 'a[href="/docs/intro-react-native-components"]'

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
    headingText: 'Core Components and Native Components',
    selector: coreComponentsLinkSelector,
    urlPattern: coreComponentsUrlPattern,
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
