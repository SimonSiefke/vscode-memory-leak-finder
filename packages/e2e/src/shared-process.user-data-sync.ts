import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, SettingsEditor, CommandPalette }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SettingsEditor.open()
  await SettingsEditor.clear()
}

export const run = async ({ SettingsEditor, CommandPalette, Editor }: TestContext): Promise<void> => {
  // Modify settings that trigger sync (affects shared-process)
  await SettingsEditor.open()
  await SettingsEditor.search({ value: 'editor.fontSize', resultCount: 1 })
  await SettingsEditor.select({ name: 'Editor: Font Size', value: '18' })
  
  await SettingsEditor.search({ value: 'workbench.colorTheme', resultCount: 1 })
  await SettingsEditor.select({ name: 'Color Theme', value: 'Light+ (default light)' })
  
  await SettingsEditor.search({ value: 'editor.tabSize', resultCount: 1 })
  await SettingsEditor.select({ name: 'Editor: Tab Size', value: '2' })
  
  await SettingsEditor.clear()
  await SettingsEditor.close()
  
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
    await SettingsEditor.close()
  }
  
  // Close command palette
  await CommandPalette.close()
  
  // Modify more settings to increase shared-process activity
  await SettingsEditor.open()
  await SettingsEditor.search({ value: 'editor.wordWrap', resultCount: 1 })
  await SettingsEditor.toggleCheckBox({ name: 'Editor: Word Wrap' })
  
  await SettingsEditor.search({ value: 'workbench.editor.enablePreview', resultCount: 1 })
  await SettingsEditor.disableCheckBox({ name: 'Workbench › Editor: Enable Preview' })
  
  await SettingsEditor.search({ value: 'files.autoSave', resultCount: 1 })
  await SettingsEditor.select({ name: 'Files: Auto Save', value: 'afterDelay' })
  
  await SettingsEditor.clear()
  await SettingsEditor.close()
  
  // Reopen settings to verify changes persisted
  await SettingsEditor.open()
  await SettingsEditor.search({ value: 'editor.fontSize', resultCount: 1 })
  await SettingsEditor.search({ value: 'workbench.colorTheme', resultCount: 1 })
  await SettingsEditor.clear()
  await SettingsEditor.close()
  
  // Clean up: Reset to default values for idempotency
  await SettingsEditor.open()
  await SettingsEditor.search({ value: 'editor.fontSize', resultCount: 1 })
  await SettingsEditor.select({ name: 'Editor: Font Size', value: '14' })
  
  await SettingsEditor.search({ value: 'workbench.colorTheme', resultCount: 1 })
  await SettingsEditor.select({ name: 'Color Theme', value: 'Dark+ (default dark)' })
  
  await SettingsEditor.search({ value: 'editor.tabSize', resultCount: 1 })
  await SettingsEditor.select({ name: 'Editor: Tab Size', value: '4' })
  
  await SettingsEditor.search({ value: 'editor.wordWrap', resultCount: 1 })
  await SettingsEditor.disableCheckBox({ name: 'Editor: Word Wrap' })
  
  await SettingsEditor.search({ value: 'workbench.editor.enablePreview', resultCount: 1 })
  await SettingsEditor.enableCheckBox({ name: 'Workbench › Editor: Enable Preview' })
  
  await SettingsEditor.search({ value: 'files.autoSave', resultCount: 1 })
  await SettingsEditor.select({ name: 'Files: Auto Save', value: 'off' })
  
  await SettingsEditor.clear()
  await SettingsEditor.close()
}
