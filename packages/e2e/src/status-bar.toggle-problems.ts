import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ Editor, Panel }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Panel.hide()
}

export const run = async ({ StatusBar }: TestContext): Promise<void> => {
  // @ts-ignore
  await StatusBar.hideItem('status.problems')
  // @ts-ignore
  await StatusBar.showItem('status.problems')
}
