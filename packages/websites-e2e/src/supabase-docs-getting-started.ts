import type { TestContext } from '../types.js'

export const requiresNetwork = true

export const skip = true

const docsUrl = 'https://supabase.com/docs'
const docsUrlPattern = /^https:\/\/supabase\.com\/docs\/?$/
const gettingStartedUrlPattern = /^https:\/\/supabase\.com\/docs\/guides\/getting-started\/?$/
const gettingStartedLinkSelector = 'a[href="/docs/guides/getting-started"]'

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
    text: 'Supabase Documentation',
    urlPattern: docsUrlPattern,
  })
}

export const run = async ({ SimpleBrowser }: TestContext): Promise<void> => {
  await SimpleBrowser.clickPageLink({
    headingText: 'Getting Started',
    selector: gettingStartedLinkSelector,
    urlPattern: gettingStartedUrlPattern,
  })
  await SimpleBrowser.back({
    urlPattern: docsUrlPattern,
  })
  await SimpleBrowser.shouldHaveText({
    selector: 'h1',
    text: 'Supabase Documentation',
    urlPattern: docsUrlPattern,
  })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
