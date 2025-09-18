import type { TestContext } from '../types.js'

export const setup = async ({ Editor, SettingsEditor }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SettingsEditor.open()
  await SettingsEditor.search({
    value: 'comments.visible',
    resultCount: 1,
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
