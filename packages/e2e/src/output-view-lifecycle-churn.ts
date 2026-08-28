import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Editor, Panel }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Panel.hide()
}

export const run = async ({ Output }: TestContext): Promise<void> => {
  await Output.show()
  await Output.select('Main', { shouldHaveContent: true })
  await Output.filter('update')
  await Output.clearFilter()
  await Output.select('Extension Host')
  await Output.select('Main')
  await Output.hide()
}

export const teardown = async ({ Editor, Panel }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Panel.hide()
}
