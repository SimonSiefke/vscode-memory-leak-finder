import type { TestContext } from '../types.js'

export const requiresNetwork = true

export const skip = true

const storeUrl = 'https://demo.vercel.store'
const storeUrlPattern = /^https:\/\/demo\.vercel\.store\/?$/
const tshirtUrlPattern = /^https:\/\/demo\.vercel\.store\/product\/acme-geometric-circles-t-shirt\/?$/
const tshirtLinkSelector = 'a[href="/product/acme-geometric-circles-t-shirt"]'
const logoLinkSelector = 'body > nav a[href="/"]'

export const setup = async ({ Editor, Notification, SideBar, SimpleBrowser, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([])
  await Editor.closeAll()
  await SideBar.hide()
  await Notification.closeAll({ force: true })
  await SimpleBrowser.show({
    url: storeUrl,
  })
  await SimpleBrowser.shouldHaveText({
    selector: 'h3',
    text: 'Acme Circles T-Shirt',
    urlPattern: storeUrlPattern,
  })
}

export const run = async ({ SimpleBrowser }: TestContext): Promise<void> => {
  await SimpleBrowser.clickPageLink({
    headingText: 'Acme Circles T-Shirt',
    selector: tshirtLinkSelector,
    urlPattern: tshirtUrlPattern,
  })
  await SimpleBrowser.clickPageLink({
    selector: logoLinkSelector,
    urlPattern: storeUrlPattern,
  })
  await SimpleBrowser.shouldHaveText({
    selector: 'h3',
    text: 'Acme Circles T-Shirt',
    urlPattern: storeUrlPattern,
  })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
