import type { TestContext } from '../types.js'

export const requiresNetwork = true

export const skip = true

const installationUrl = 'https://tailwindcss.com/docs/installation/using-vite'
const installationUrlPattern = /^https:\/\/tailwindcss\.com\/docs\/installation\/using-vite\/?$/
const utilityClassesUrlPattern = /^https:\/\/tailwindcss\.com\/docs\/styling-with-utility-classes\/?$/
const utilityClassesLinkSelector = 'a[href="/docs/styling-with-utility-classes"]'

export const setup = async ({ Editor, SimpleBrowser, Workspace, Notification, SideBar }: TestContext): Promise<void> => {
  await Workspace.setFiles([])
  await Editor.closeAll()
  await SideBar.hide()
  await Notification.closeAll({ force: true })
  await SimpleBrowser.show({
    url: installationUrl,
  })
  await SimpleBrowser.shouldHaveText({
    selector: 'h1',
    text: 'Get started with Tailwind CSS',
    urlPattern: installationUrlPattern,
  })
}

export const run = async ({ SimpleBrowser }: TestContext): Promise<void> => {
  await SimpleBrowser.clickPageLink({
    headingText: 'Styling with utility classes',
    selector: utilityClassesLinkSelector,
    urlPattern: utilityClassesUrlPattern,
  })
  await SimpleBrowser.back({
    urlPattern: installationUrlPattern,
  })
  await SimpleBrowser.shouldHaveText({
    selector: 'h1',
    text: 'Get started with Tailwind CSS',
    urlPattern: installationUrlPattern,
  })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
