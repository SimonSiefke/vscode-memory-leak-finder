import type { TestContext } from '../types.ts'

export const setup = async ({ Panel }: TestContext): Promise<void> => {
  await Panel.show()
}

export const run = async ({ ContextMenu, Panel }: TestContext): Promise<void> => {
  await Panel.openTabsContextMenu()
  await ContextMenu.select('Show Icons')
  await Panel.openTabsContextMenu()
  await ContextMenu.select('Show Labels')
}
