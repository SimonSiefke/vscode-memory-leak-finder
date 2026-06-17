import type { TestContext } from '../types.js'

export const requiresNetwork = true

const blogUrl = 'https://react.dev/blog'
const blogUrlPattern = /^https:\/\/react\.dev\/blog\/?$/
const articleUrlPattern = /^https:\/\/react\.dev\/blog\/\d{4}\/\d{2}\/\d{2}\/[^/?#]+\/?$/
const firstBlogPostLinkSelector = 'main a[href^="/blog/20"], main a[href^="https://react.dev/blog/20"]'
const blogLinkSelector = 'main a[href="/blog"], main a[href="/blog/"], a[href="/blog"], a[href="/blog/"]'

export const setup = async ({ Editor, SimpleBrowser, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([])
  await Editor.closeAll()
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

  await SimpleBrowser.clickPageLink({
    headingText: 'React Blog',
    selector: blogLinkSelector,
    urlPattern: blogUrlPattern,
  })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
