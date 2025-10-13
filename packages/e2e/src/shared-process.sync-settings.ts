import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, SettingsEditor, QuickPick }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SettingsEditor.open()
  await SettingsEditor.clear()
}

export const run = async ({ SettingsEditor, QuickPick, Editor }: TestContext): Promise<void> => {
  // Test sync-related settings (affects shared-process)
  await SettingsEditor.open()
  await SettingsEditor.search({ value: 'editor.wordWrap', resultCount: 5 })
  await SettingsEditor.search({ value: 'workbench.editor.enablePreview', resultCount: 5 })
  await SettingsEditor.search({ value: 'files.autoSave', resultCount: 5 })

  await SettingsEditor.clear()

  // Test sync commands via command palette
  await QuickPick.showCommands()
  await QuickPick.type('sync')

  const syncCommands = await QuickPick.getVisibleCommands()
  const hasSyncCommands = syncCommands.some((cmd) => cmd.toLowerCase().includes('sync') || cmd.toLowerCase().includes('settings'))

  if (hasSyncCommands) {
    try {
      await QuickPick.select('Preferences: Open Settings')
    } catch (error) {
      // Sync commands might not be available, continue
    }
  }

  // Don't try to close quick pick if it's not open
}
