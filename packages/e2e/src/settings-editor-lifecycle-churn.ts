import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}

export const run = async ({ Editor, SettingsEditor }: TestContext): Promise<void> => {
  try {
    await SettingsEditor.open()
    await SettingsEditor.ensureIdle()
    await SettingsEditor.search({
      resultCount: 1,
      value: 'comments.visible',
    })
    await SettingsEditor.clear()
    await SettingsEditor.openTab('Workspace')
    await SettingsEditor.openTab('User')
  } finally {
    await Editor.closeAll()
  }
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
