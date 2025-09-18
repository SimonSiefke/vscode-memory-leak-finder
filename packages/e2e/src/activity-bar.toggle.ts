import type { TestContext } from '../types.js'

export const setup = async ({  Editor  }: TestContext): Promise<void> => {
  await Editor.closeAll()
}

export const run = async ({  ActivityBar  }: TestContext): Promise<void> => {
  await ActivityBar.hide()
  await ActivityBar.show()
}
