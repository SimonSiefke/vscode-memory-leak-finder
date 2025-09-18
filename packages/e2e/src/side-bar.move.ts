import type { TestContext } from '../types.js'

export const run = async ({  SideBar  }: TestContext): Promise<void> => {
  await SideBar.moveRight()
  await SideBar.moveLeft()
}
