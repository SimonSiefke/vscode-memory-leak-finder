import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ Editor, SettingsEditor }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SettingsEditor.open()
  await SettingsEditor.search({
    resultCount: 2,
    value: 'Editor: Auto Closing Comments',
  })
}

export const run = async ({ SettingsEditor }: TestContext): Promise<void> => {
  // @ts-ignore
  await SettingsEditor.openSettingsContextMenu('Comments', { waitForItem: 'Reset Setting' })
  // @ts-ignore
  await SettingsEditor.closeSettingsContextMenu('Comments')
}
