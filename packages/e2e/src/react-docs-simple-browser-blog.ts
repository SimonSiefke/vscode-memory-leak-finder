import type { TestContext } from '../types.js'

export const requiresNetwork = true

const blogUrl = 'https://react.dev/blog'
const blogUrlPattern = /^https:\/\/react\.dev\/blog\/?$/
const articleUrlPattern = /^https:\/\/react\.dev\/blog\/\d{4}\/\d{2}\/\d{2}\/[^/?#]+\/?$/
const firstBlogPostLinkSelector = 'main a[href^="/blog/20"], main a[href^="https://react.dev/blog/20"]'
const blogLinkSelector = 'main a[href="/blog"], main a[href="/blog/"], a[href="/blog"], a[href="/blog/"]'

const assertArticleHeading = async (SimpleBrowser: TestContext['SimpleBrowser']): Promise<void> => {
  await SimpleBrowser.executeJavaScript({
    expression: `(async () => {
  for (let attempt = 0; attempt < 60; attempt++) {
    const heading = document.querySelector('h1')
    const text = heading?.textContent?.trim() || ''
    if (text && text !== 'React Blog') {
      return
    }
    await new Promise((resolve) => requestAnimationFrame(resolve))
  }
  throw new Error('Expected React blog article heading')
})()`,
  })
}

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
    selector: firstBlogPostLinkSelector,
    urlPattern: articleUrlPattern,
  })
  await assertArticleHeading(SimpleBrowser)

  await SimpleBrowser.clickPageLink({
    selector: blogLinkSelector,
    urlPattern: blogUrlPattern,
  })
  await SimpleBrowser.shouldHaveText({
    selector: 'h1',
    text: 'React Blog',
    urlPattern: blogUrlPattern,
  })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
