import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, SettingsEditor }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SettingsEditor.open()
  await SettingsEditor.ensureIdle()
  await SettingsEditor.collapseOutline()
}

export const run = async ({ SettingsEditor }: TestContext): Promise<void> => {
  await SettingsEditor.focusOutline('Commonly Used')
  await SettingsEditor.focusOutline('Text Editor')
  await SettingsEditor.focusOutline('Workbench')
  await SettingsEditor.focusOutline('Window')
  await SettingsEditor.focusOutline('Features')
  await SettingsEditor.focusOutline('Application')
  await SettingsEditor.focusOutline('Security')
  await SettingsEditor.focusOutline('Extensions')
  await SettingsEditor.focusOutline('Commonly Used')
}
