import type { TestContext } from '../types.js'

export const requiresNetwork = true

export const skip = true

const playUrl = 'https://play.grafana.org/'
const playUrlPattern = /^https:\/\/play\.grafana\.org\/?$/
const dashboardsUrlPattern = /^https:\/\/play\.grafana\.org\/dashboards\/?$/
const dashboardsLinkSelector = 'a[href="/dashboards"]'

export const setup = async ({ Editor, Notification, SideBar, SimpleBrowser, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([])
  await Editor.closeAll()
  await SideBar.hide()
  await Notification.closeAll({ force: true })
  await SimpleBrowser.show({
    url: playUrl,
  })
  await SimpleBrowser.shouldHaveText({
    selector: 'h1',
    text: 'Welcome to Grafana Play',
    urlPattern: playUrlPattern,
  })
}

export const run = async ({ SimpleBrowser }: TestContext): Promise<void> => {
  await SimpleBrowser.clickPageLink({
    headingText: 'Dashboards',
    selector: dashboardsLinkSelector,
    urlPattern: dashboardsUrlPattern,
  })
  await SimpleBrowser.back({
    urlPattern: playUrlPattern,
  })
  await SimpleBrowser.shouldHaveText({
    selector: 'h1',
    text: 'Welcome to Grafana Play',
    urlPattern: playUrlPattern,
  })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
