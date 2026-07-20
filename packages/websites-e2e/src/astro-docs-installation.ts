import type { TestContext } from '../types.js'

export const requiresNetwork = true

export const skip = true

const overviewUrl = 'https://docs.astro.build/en/getting-started/'
const overviewUrlPattern = /^https:\/\/docs\.astro\.build\/en\/getting-started\/?$/
const installationUrlPattern = /^https:\/\/docs\.astro\.build\/en\/install-and-setup\/?$/
const installationLinkSelector = 'a[href="/en/install-and-setup/"]'

export const setup = async ({ Editor, SimpleBrowser, Workspace, Notification, SideBar }: TestContext): Promise<void> => {
  await Workspace.setFiles([])
  await Editor.closeAll()
  await SideBar.hide()
  await Notification.closeAll({ force: true })
  await SimpleBrowser.show({
    url: overviewUrl,
  })
  await SimpleBrowser.shouldHaveText({
    selector: 'h1',
    text: 'Astro Docs',
    urlPattern: overviewUrlPattern,
  })
}

export const run = async ({ SimpleBrowser }: TestContext): Promise<void> => {
  await SimpleBrowser.clickPageLink({
    headingText: 'Install Astro',
    selector: installationLinkSelector,
    urlPattern: installationUrlPattern,
  })
  await SimpleBrowser.back({
    urlPattern: overviewUrlPattern,
  })
  await SimpleBrowser.shouldHaveText({
    selector: 'h1',
    text: 'Astro Docs',
    urlPattern: overviewUrlPattern,
  })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
