import type { TestContext } from '../types.js'

export const requiresNetwork = true

export const skip = true

const docsUrl = 'https://vercel.com/docs'
const docsUrlPattern = /^https:\/\/vercel\.com\/docs\/?$/
const gettingStartedUrlPattern = /^https:\/\/vercel\.com\/docs\/getting-started-with-vercel\/?$/
const gettingStartedLinkSelector = 'a[href="/docs/getting-started-with-vercel"]'

export const setup = async ({ Editor, SimpleBrowser, Workspace, Notification, SideBar }: TestContext): Promise<void> => {
  await Workspace.setFiles([])
  await Editor.closeAll()
  await SideBar.hide()
  await Notification.closeAll({ force: true })
  await SimpleBrowser.show({
    url: docsUrl,
  })
  await SimpleBrowser.shouldHaveText({
    selector: 'h1',
    text: 'Ship anything with Vercel',
    urlPattern: docsUrlPattern,
  })
}

export const run = async ({ SimpleBrowser }: TestContext): Promise<void> => {
  await SimpleBrowser.clickPageLink({
    headingText: 'Getting started with Vercel',
    selector: gettingStartedLinkSelector,
    urlPattern: gettingStartedUrlPattern,
  })
  await SimpleBrowser.back({
    urlPattern: docsUrlPattern,
  })
  await SimpleBrowser.shouldHaveText({
    selector: 'h1',
    text: 'Ship anything with Vercel',
    urlPattern: docsUrlPattern,
  })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
