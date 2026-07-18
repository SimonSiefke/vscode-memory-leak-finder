import type { TestContext } from '../types.js'

export const requiresNetwork = true

export const skip = true

const quickStartUrl = 'https://guides.emberjs.com/release/getting-started/quick-start/'
const quickStartUrlPattern = /^https:\/\/guides\.emberjs\.com\/release\/getting-started\/quick-start\/?$/
const htmlCssJavascriptUrlPattern = /^https:\/\/guides\.emberjs\.com\/release\/getting-started\/working-with-html-css-and-javascript\/?$/
const htmlCssJavascriptLinkSelector = 'a[href="/release/getting-started/working-with-html-css-and-javascript/"]'

export const setup = async ({ Editor, SimpleBrowser, Workspace, Notification, SideBar }: TestContext): Promise<void> => {
  await Workspace.setFiles([])
  await Editor.closeAll()
  await SideBar.hide()
  await Notification.closeAll({ force: true })
  await SimpleBrowser.show({
    url: quickStartUrl,
  })
  await SimpleBrowser.shouldHaveText({
    selector: 'h1',
    text: 'Quick Start',
    urlPattern: quickStartUrlPattern,
  })
}

export const run = async ({ SimpleBrowser }: TestContext): Promise<void> => {
  await SimpleBrowser.clickPageLink({
    headingText: 'Working with HTML, CSS, and JavaScript',
    selector: htmlCssJavascriptLinkSelector,
    urlPattern: htmlCssJavascriptUrlPattern,
  })
  await SimpleBrowser.back({
    urlPattern: quickStartUrlPattern,
  })
  await SimpleBrowser.shouldHaveText({
    selector: 'h1',
    text: 'Quick Start',
    urlPattern: quickStartUrlPattern,
  })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
