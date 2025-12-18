import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}

export const run = async ({ ReleaseNotes, Editor }: TestContext): Promise<void> => {
  await ReleaseNotes.show()
  await Editor.closeAll()
}
