import type { TestContext } from '../types.js'

export const setup = async ({ Panel, Editor, SideBar, ActivityBar }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SideBar.hide()
  await Panel.hide()
  // @ts-ignore
  await ActivityBar.resetViewLocations()
}

export const run = async ({ ActivityBar, Panel }: TestContext): Promise<void> => {
  // @ts-ignore
  await ActivityBar.moveExplorerToPanel()
  // @ts-ignore
  await ActivityBar.resetViewLocations()
}
