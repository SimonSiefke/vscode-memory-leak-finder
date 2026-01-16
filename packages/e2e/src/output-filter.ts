import type { TestContext } from '../types.js'

export const skip = true

export const setup = async ({ Editor, Output, Panel, SideBar }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SideBar.hide()
  await Panel.hide()
  await Output.show()
  // @ts-ignore
  await Output.select('Main', {
    shouldHaveContent: true,
  })
  await Output.filter('update#setState')
}

export const run = async ({ Output }: TestContext): Promise<void> => {
  await Output.filter('update#setState')
  await Output.filter('update')
  await Output.filter('update#setState')
}

export const teardown = async ({ Panel }: TestContext) => {
  await Panel.hide()
}
