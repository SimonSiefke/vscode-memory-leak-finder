import type { TestContext } from '../types.js'

export const skip = true

export const setup = async ({  Editor  }: TestContext): Promise<void> => {
  await Editor.closeAll()
}

export const run = async ({  Editor, RunningExtensions  }: TestContext): Promise<void> => {
  await RunningExtensions.show()
  await Editor.closeAll()
}
