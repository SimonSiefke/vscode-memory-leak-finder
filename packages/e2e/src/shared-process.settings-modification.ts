import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, SettingsEditor }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SettingsEditor.open()
  await SettingsEditor.clear()
}

export const run = async ({ SettingsEditor }: TestContext): Promise<void> => {
  // Open settings (triggers shared-process communication)
  await SettingsEditor.open()

  // Search for various settings that affect shared-process
  await SettingsEditor.search({ value: 'editor.fontSize', resultCount: 7 })
  await SettingsEditor.search({ value: 'workbench.colorTheme', resultCount: 1 })
  await SettingsEditor.search({ value: 'files.autoSave', resultCount: 1 })
  await SettingsEditor.search({ value: 'editor.tabSize', resultCount: 1 })
  await SettingsEditor.search({ value: 'editor.wordWrap', resultCount: 1 })
  await SettingsEditor.search({ value: 'workbench.editor.enablePreview', resultCount: 1 })

  // Search for more settings to increase shared-process activity
  await SettingsEditor.search({ value: 'editor.minimap', resultCount: 1 })
  await SettingsEditor.search({ value: 'editor.lineNumbers', resultCount: 1 })
  await SettingsEditor.search({ value: 'editor.cursorBlinking', resultCount: 1 })

  // Clear search
  await SettingsEditor.clear()

  // Reopen settings to verify state
  await SettingsEditor.open()
  await SettingsEditor.search({ value: 'editor.fontSize', resultCount: 7 })
  await SettingsEditor.search({ value: 'workbench.colorTheme', resultCount: 1 })
  await SettingsEditor.clear()
}
