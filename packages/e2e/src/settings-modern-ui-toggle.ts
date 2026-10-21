import type { TestContext } from '../types.ts'

const modernUiSetting = 'workbench.experimental.modernUI'
let setting = modernUiSetting

export const setup = async ({ Editor, SettingsEditor }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SettingsEditor.open()
  await SettingsEditor.search({
    resultCount: 'any',
    value: modernUiSetting,
  })
  // Older releases have no Modern UI setting. Exercise a layout checkbox that
  // exists since before 1.100 instead, keeping the enable/disable lifecycle.
  setting = modernUiSetting
  if (!(await SettingsEditor.hasCheckBox(modernUiSetting))) {
    setting = 'workbench.layoutControl.enabled'
    await SettingsEditor.clear()
    await SettingsEditor.search({ resultCount: 'many', value: setting })
  }
  await SettingsEditor.disableCheckBox({
    name: setting,
  })
}

export const run = async ({ SettingsEditor }: TestContext): Promise<void> => {
  await SettingsEditor.enableCheckBox({
    name: setting,
  })
  await SettingsEditor.disableCheckBox({
    name: setting,
  })
}
