import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ Editor, Panel }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Panel.hide()
}

export const run = async ({ StatusBar }: TestContext): Promise<void> => {
  const id = 'status.problems'
  // @ts-ignore
  await StatusBar.hideItem(id)
  // @ts-ignore
  await StatusBar.showItem(id)
}
