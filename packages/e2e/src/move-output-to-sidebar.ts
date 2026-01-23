import type { TestContext } from '../types.js'

export const skip = 1

export const setup = async ({ Editor, Panel, Output, SideBar }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SideBar.hide()
  await Panel.show()
  // ensure output view is visible in panel
  // @ts-ignore
  await Output.show()
}

export const run = async ({ Output }: TestContext): Promise<void> => {
  // @ts-ignore
  await Output.moveOutputToSidebar()
}
