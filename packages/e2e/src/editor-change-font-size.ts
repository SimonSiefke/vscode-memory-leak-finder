import type { TestContext } from '../types.js'

export const skip = 1

export const setup = async ({ Editor, SettingsEditor, Workspace, SideBar }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: 'console.log("Hello World");\n// This is a test file for font size changes',
      name: 'test.js',
    },
  ])
  await Editor.closeAll()
  await SideBar.hide()
  await Editor.open('test.js')
  await Editor.splitRight()
  await SettingsEditor.open()
  await SettingsEditor.search({
    resultCount: 7,
    value: 'editor.fontSize',
  })
  await SettingsEditor.setTextInput({
    name: 'editor.fontSize',
    value: '14',
    type: 'number',
  })
}

export const run = async ({ SettingsEditor, Editor }: TestContext): Promise<void> => {
  // @ts-ignore
  await Editor.shouldHaveFontSize('14px')
  await SettingsEditor.setTextInput({
    name: 'editor.fontSize',
    value: '40',
    type: 'number',
  })
  // @ts-ignore
  await Editor.shouldHaveFontSize('40px')
  await SettingsEditor.setTextInput({
    name: 'editor.fontSize',
    value: '14',
    type: 'number',
  })
  // @ts-ignore
  await Editor.shouldHaveFontSize('14px')
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
