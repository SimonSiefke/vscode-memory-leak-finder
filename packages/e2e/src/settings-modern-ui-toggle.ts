import type { TestContext } from '../types.ts'

const modernUiSetting = 'workbench.experimental.modernUI'

export const setup = async ({ Editor, SettingsEditor }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SettingsEditor.open()
  await SettingsEditor.search({
    resultCount: 1,
    value: modernUiSetting,
  })
  await SettingsEditor.disableCheckBox({
    name: modernUiSetting,
  })
}

export const run = async ({ SettingsEditor }: TestContext): Promise<void> => {
  await SettingsEditor.enableCheckBox({
    name: modernUiSetting,
  })
  await SettingsEditor.disableCheckBox({
    name: modernUiSetting,
  })
}
