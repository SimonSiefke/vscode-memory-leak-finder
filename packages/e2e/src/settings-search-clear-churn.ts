import type { TestContext } from '../types.ts'

export const skip = 1

const searches = [
  {
    resultCount: 1 as const,
    value: 'comments.visible',
  },
  {
    resultCount: 2 as const,
    value: 'Associations',
  },
  {
    resultCount: 'many' as const,
    value: 'editor',
  },
]

export const setup = async ({ Editor, SettingsEditor }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SettingsEditor.open()
  await SettingsEditor.ensureIdle()
}

export const run = async ({ SettingsEditor }: TestContext): Promise<void> => {
  for (const search of searches) {
    await SettingsEditor.search(search)
    await SettingsEditor.clear()
  }
  await SettingsEditor.openTab('Workspace')
  await SettingsEditor.openTab('User')
  await SettingsEditor.search({
    resultCount: 1,
    value: 'comments.visible',
  })
  await SettingsEditor.enableCheckBox({
    name: 'comments.visible',
  })
  await SettingsEditor.disableCheckBox({
    name: 'comments.visible',
  })
  await SettingsEditor.enableCheckBox({
    name: 'comments.visible',
  })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
