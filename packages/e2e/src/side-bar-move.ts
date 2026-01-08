import type { TestContext } from '../types.ts'

export const run = async ({ SideBar }: TestContext): Promise<void> => {
  await SideBar.moveRight()
  await SideBar.moveLeft()
}
