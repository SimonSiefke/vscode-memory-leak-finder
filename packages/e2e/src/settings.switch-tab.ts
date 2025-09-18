import type { TestContext } from '../types.js'

export const skip = true

export const setup = async ({  Editor, SettingsEditor  }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SettingsEditor.open()
  await SettingsEditor.ensureIdle()
  await SettingsEditor.collapseOutline()
}

export const run = async ({  SettingsEditor  }: TestContext): Promise<void> => {
  await SettingsEditor.openTab('Workspace')
  await SettingsEditor.openTab('User')
}
