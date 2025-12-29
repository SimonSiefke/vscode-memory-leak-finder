import type { TestContext } from '../types.js'

export const skip = true

export const setup = async ({ Editor, Output, Panel, SideBar }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SideBar.hide()
  await Panel.hide()
  await Output.show()
  await Output.select('Main')
  // @ts-ignore
  await Output.filter('update#setState')
}

export const run = async ({ Output }: TestContext): Promise<void> => {
  // @ts-ignore
  await Output.filter('update#setState')
  // @ts-ignore
  await Output.filter('update')
  // @ts-ignore
  await Output.filter('update#setState')
}

export const teardown = async ({ Panel }: TestContext) => {
  await Panel.hide()
}
