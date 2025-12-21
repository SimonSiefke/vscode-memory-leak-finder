import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, SettingsEditor }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SettingsEditor.open()
  await SettingsEditor.search({
    resultCount: 1,
    value: 'comments.visible',
  })
  await SettingsEditor.enableCheckBox({
    name: 'comments.visible',
  })
}

export const run = async ({ SettingsEditor }: TestContext): Promise<void> => {
  await SettingsEditor.disableCheckBox({
    name: 'comments.visible',
  })
  await SettingsEditor.enableCheckBox({
    name: 'comments.visible',
  })
}
