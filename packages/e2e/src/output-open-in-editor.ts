import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, Output, Panel, SideBar }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SideBar.hide()
  await Panel.hide()
  await Output.show()
  // @ts-ignore
  await Output.select('Main', {
    shouldHaveContent: true,
  })
}

export const run = async ({ Editor, Output }: TestContext): Promise<void> => {
  await Output.openEditor()
  await Editor.closeAll()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
