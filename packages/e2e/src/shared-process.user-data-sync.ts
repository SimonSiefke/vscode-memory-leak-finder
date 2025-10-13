import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, SettingsEditor, CommandPalette }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SettingsEditor.open()
  await SettingsEditor.clear()
}

export const run = async ({ SettingsEditor, CommandPalette, Editor }: TestContext): Promise<void> => {
  // Search for settings that trigger sync (affects shared-process)
  await SettingsEditor.open()
  await SettingsEditor.search({ value: 'editor.fontSize', resultCount: 7 })
  await SettingsEditor.search({ value: 'workbench.colorTheme', resultCount: 1 })
  await SettingsEditor.search({ value: 'editor.tabSize', resultCount: 1 })
  await SettingsEditor.search({ value: 'files.autoSave', resultCount: 1 })

  // Trigger sync-related commands via command palette
  await CommandPalette.open()
  await CommandPalette.type('sync')

  // Look for sync-related commands (these communicate with shared-process)
  const syncCommands = await CommandPalette.getVisibleCommands()
  const hasSyncCommands = syncCommands.some(cmd =>
    cmd.toLowerCase().includes('sync') ||
    cmd.toLowerCase().includes('settings')
  )

  // If sync commands are available, interact with them
  if (hasSyncCommands) {
    await CommandPalette.select('Preferences: Open Settings')
  }

  // Close command palette
  await CommandPalette.close()

  // Search for more settings to increase shared-process activity
  await SettingsEditor.open()
  await SettingsEditor.search({ value: 'editor.wordWrap', resultCount: 1 })
  await SettingsEditor.search({ value: 'workbench.editor.enablePreview', resultCount: 1 })
  await SettingsEditor.search({ value: 'files.autoSave', resultCount: 1 })

  await SettingsEditor.clear()

  // Reopen settings to verify state
  await SettingsEditor.open()
  await SettingsEditor.search({ value: 'editor.fontSize', resultCount: 7 })
  await SettingsEditor.search({ value: 'workbench.colorTheme', resultCount: 1 })
  await SettingsEditor.clear()
}
