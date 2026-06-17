import type { TestContext } from '../types.js'

export const skip = 1

export const setup = async ({ Editor, Panel, Problems, SideBar }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SideBar.hide()
  await Panel.show()
  // ensure problems view is visible in panel
  // @ts-ignore
  await Problems.show()
}

export const run = async ({ Problems }: TestContext): Promise<void> => {
  // @ts-ignore
  await Problems.moveProblemsToSidebar()
}
