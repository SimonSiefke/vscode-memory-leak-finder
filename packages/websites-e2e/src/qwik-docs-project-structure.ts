import type { TestContext } from '../types.js'

export const requiresNetwork = true

export const skip = true

const gettingStartedUrl = 'https://qwik.dev/docs/getting-started/'
const gettingStartedUrlPattern = /^https:\/\/qwik\.dev\/docs\/getting-started\/?$/
const projectStructureUrlPattern = /^https:\/\/qwik\.dev\/docs\/project-structure\/?$/
const projectStructureLinkSelector = 'a[href="/docs/project-structure/"]'

export const setup = async ({ Editor, SimpleBrowser, Workspace, Notification, SideBar }: TestContext): Promise<void> => {
  await Workspace.setFiles([])
  await Editor.closeAll()
  await SideBar.hide()
  await Notification.closeAll({ force: true })
  await SimpleBrowser.show({
    url: gettingStartedUrl,
  })
  await SimpleBrowser.shouldHaveText({
    selector: 'h1',
    text: 'Getting Started Qwikly',
    urlPattern: gettingStartedUrlPattern,
  })
}

export const run = async ({ SimpleBrowser }: TestContext): Promise<void> => {
  await SimpleBrowser.clickPageLink({
    headingText: 'Project Structure',
    selector: projectStructureLinkSelector,
    urlPattern: projectStructureUrlPattern,
  })
  await SimpleBrowser.back({
    urlPattern: gettingStartedUrlPattern,
  })
  await SimpleBrowser.shouldHaveText({
    selector: 'h1',
    text: 'Getting Started Qwikly',
    urlPattern: gettingStartedUrlPattern,
  })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
