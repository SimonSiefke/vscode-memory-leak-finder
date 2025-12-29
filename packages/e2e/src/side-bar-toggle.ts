import type { TestContext } from '../types.ts'

export const skip = true

export const run = async ({ SideBar }: TestContext): Promise<void> => {
  await SideBar.hide()
  await SideBar.show()
}
