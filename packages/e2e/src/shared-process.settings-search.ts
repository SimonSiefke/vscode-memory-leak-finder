import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, SettingsEditor }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SettingsEditor.open()
  await SettingsEditor.clear()
}

export const run = async ({ SettingsEditor }: TestContext): Promise<void> => {
  // Test settings search functionality (affects shared-process)
  await SettingsEditor.open()
  await SettingsEditor.search({ value: 'editor.fontSize', resultCount: 7 })
  await SettingsEditor.search({ value: 'workbench.colorTheme', resultCount: 1 })
  await SettingsEditor.search({ value: 'editor.tabSize', resultCount: 5 })
  await SettingsEditor.search({ value: 'files.autoSave', resultCount: 5 })

  await SettingsEditor.clear()
}
