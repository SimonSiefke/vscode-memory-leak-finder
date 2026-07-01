import type { TestContext } from '../types.js'

export const requiresNetwork = true

export const skip = true

const blogUrl = 'https://react.dev/blog'
const blogUrlPattern = /^https:\/\/react\.dev\/blog\/?$/
const articleUrlPattern = /^https:\/\/react\.dev\/blog\/\d{4}\/\d{2}\/\d{2}\/[^/?#]+\/?$/
const firstBlogPostLinkSelector = 'main a[href^="/blog/20"] div.text-link'
const blogLinkSelector = 'main article a[href="/blog"]'

export const setup = async ({ Editor, SimpleBrowser, Workspace, Notification, SideBar }: TestContext): Promise<void> => {
  await Workspace.setFiles([])
  await Editor.closeAll()
  await SideBar.hide()
  // TODO
  await new Promise((r) => {
    setTimeout(r, 3000)
  })
  await Notification.closeAll()
  await SimpleBrowser.show({
    url: blogUrl,
  })
  await SimpleBrowser.shouldHaveText({
    selector: 'h1',
    text: 'React Blog',
    urlPattern: blogUrlPattern,
  })
}

export const run = async ({ SimpleBrowser }: TestContext): Promise<void> => {
  await SimpleBrowser.clickPageLink({
    requireHeading: true,
    selector: firstBlogPostLinkSelector,
    urlPattern: articleUrlPattern,
  })

  await new Promise((r) => {
    setTimeout(r, 1000)
  })
  await SimpleBrowser.clickPageLink({
    headingText: 'React Blog',
    selector: blogLinkSelector,
    urlPattern: blogUrlPattern,
  })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
