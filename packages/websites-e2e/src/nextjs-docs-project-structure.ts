import type { TestContext } from '../types.js'

export const requiresNetwork = true

export const skip = true

const docsUrl = 'https://nextjs.org/docs'
const docsUrlPattern = /^https:\/\/nextjs\.org\/docs\/?$/
const projectStructureUrlPattern = /^https:\/\/nextjs\.org\/docs\/app\/getting-started\/project-structure\/?$/
const projectStructureLinkSelector = 'a[href="/docs/app/getting-started/project-structure"]'

export const setup = async ({ Editor, SimpleBrowser, Workspace, Notification, SideBar }: TestContext): Promise<void> => {
  await Workspace.setFiles([])
  await Editor.closeAll()
  await SideBar.hide()
  await Notification.closeAll({ force: true })
  await SimpleBrowser.show({
    url: docsUrl,
  })
  await SimpleBrowser.shouldHaveText({
    text: 'What is Next.js?',
    urlPattern: docsUrlPattern,
  })
}

export const run = async ({ SimpleBrowser }: TestContext): Promise<void> => {
  await SimpleBrowser.clickPageLink({
    headingText: 'Project structure and organization',
    selector: projectStructureLinkSelector,
    urlPattern: projectStructureUrlPattern,
  })
  await SimpleBrowser.back({
    urlPattern: docsUrlPattern,
  })
  await SimpleBrowser.shouldHaveText({
    text: 'What is Next.js?',
    urlPattern: docsUrlPattern,
  })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
