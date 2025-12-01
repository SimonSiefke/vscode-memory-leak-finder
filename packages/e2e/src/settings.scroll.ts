import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ Editor, Settings }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Settings.open()
}

export const run = async ({ SettingsEditor }: TestContext): Promise<void> => {
  // await Editor.closeAll()
  await SettingsEditor.scrollDown()
  // await SettingsEditor.scrollUp()
}
