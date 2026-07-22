import type { TestContext } from '../types.js'

export const skip = 1

export const requiresNetwork = true

export const setup = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}

export const run = async ({ Editor, LanguageModelEditor }: TestContext): Promise<void> => {
  await LanguageModelEditor.open()
  await Editor.splitDown({ groupCount: 0, splitInto: true })
  await Editor.closeAll()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
