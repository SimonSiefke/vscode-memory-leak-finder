import type { TestContext } from '../types.ts'

export const setup = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}

export const run = async ({ Settings, Editor }: TestContext): Promise<void> => {
  await Settings.open()
  await Editor.closeAll()
}
