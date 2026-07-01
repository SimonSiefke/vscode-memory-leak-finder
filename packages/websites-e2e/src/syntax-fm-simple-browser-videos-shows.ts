import type { TestContext } from '../types.js'

export const requiresNetwork = true

export const skip = true

const videosUrl = 'https://syntax.fm/videos'
const videosUrlPattern = /^https:\/\/syntax\.fm\/videos\/?$/
const showsUrlPattern = /^https:\/\/syntax\.fm\/shows\/?$/
const showsLinkSelector = 'a[href="/shows"]'
const videosLinkSelector = 'a[href="/videos"]'

const wait = (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export const setup = async ({ Editor, SimpleBrowser, Workspace, Notification, SideBar }: TestContext): Promise<void> => {
  await Workspace.setFiles([])
  await Editor.closeAll()
  await SideBar.hide()
  await wait(3000)
  await Notification.closeAll({ force: true })
  await SimpleBrowser.show({
    url: videosUrl,
  })
  await SimpleBrowser.shouldHaveText({
    selector: 'h1',
    text: 'All Playlists',
    urlPattern: videosUrlPattern,
  })
}

export const run = async ({ SimpleBrowser }: TestContext): Promise<void> => {
  await SimpleBrowser.clickPageLink({
    headingText: 'All Episodes',
    selector: showsLinkSelector,
    urlPattern: showsUrlPattern,
  })

  await wait(1000)

  await SimpleBrowser.clickPageLink({
    headingText: 'All Playlists',
    selector: videosLinkSelector,
    urlPattern: videosUrlPattern,
  })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
