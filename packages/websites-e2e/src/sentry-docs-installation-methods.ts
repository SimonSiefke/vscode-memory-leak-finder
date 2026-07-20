import type { TestContext } from '../types.js'

export const requiresNetwork = true

export const skip = true

const browserJavascriptUrl = 'https://docs.sentry.io/platforms/javascript/'
const browserJavascriptUrlPattern = /^https:\/\/docs\.sentry\.io\/platforms\/javascript\/?$/
const installationMethodsUrlPattern = /^https:\/\/docs\.sentry\.io\/platforms\/javascript\/install\/?$/
const installationMethodsLinkSelector = 'a[href="/platforms/javascript/install/"]'

export const setup = async ({ Editor, SimpleBrowser, Workspace, Notification, SideBar }: TestContext): Promise<void> => {
  await Workspace.setFiles([])
  await Editor.closeAll()
  await SideBar.hide()
  await Notification.closeAll({ force: true })
  await SimpleBrowser.show({
    url: browserJavascriptUrl,
  })
  await SimpleBrowser.shouldHaveText({
    selector: 'h1',
    text: 'Browser JavaScript',
    urlPattern: browserJavascriptUrlPattern,
  })
}

export const run = async ({ SimpleBrowser }: TestContext): Promise<void> => {
  await SimpleBrowser.clickPageLink({
    headingText: 'Installation Methods',
    selector: installationMethodsLinkSelector,
    urlPattern: installationMethodsUrlPattern,
  })
  await SimpleBrowser.back({
    urlPattern: browserJavascriptUrlPattern,
  })
  await SimpleBrowser.shouldHaveText({
    selector: 'h1',
    text: 'Browser JavaScript',
    urlPattern: browserJavascriptUrlPattern,
  })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
