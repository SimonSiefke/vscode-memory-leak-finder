import type { TestContext } from '../types.js'

export const skip = true

export const setup = async ({  Editor, Output, Panel  }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Panel.hide()
  await Output.show()
  await Output.select('Main')
}

export const run = async ({  Output  }: TestContext): Promise<void> => {
  await Output.select('Window')
  await Output.select('Main')
}
