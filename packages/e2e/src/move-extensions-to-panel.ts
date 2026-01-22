import type { TestContext } from '../types.js'

export const skip = 1

export const setup = async ({ ActivityBar, Editor, Panel, SideBar }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SideBar.hide()
  await Panel.hide()
  // @ts-ignore
  await ActivityBar.resetViewLocations()
}

export const run = async ({ ActivityBar }: TestContext): Promise<void> => {
  // @ts-ignore
  await ActivityBar.moveExtensionsToPanel()
  // @ts-ignore
  await ActivityBar.resetViewLocations()
}
