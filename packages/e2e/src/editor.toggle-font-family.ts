import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, Workspace, SettingsEditor }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'file.txt',
      content: 'sample text',
    },
  ])
  await Editor.closeAll()
  await Editor.open('file.txt')
  await Editor.splitRight()
  await SettingsEditor.open()
  await SettingsEditor.search({
    value: 'editor.fontFamily',
    resultCount: 1,
  })
}

export const run = async ({ SettingsEditor }: TestContext): Promise<void> => {
  await SettingsEditor.setTextInput({
    name: 'editor.fontFamily',
    value: 'serif',
  })
  await SettingsEditor.setTextInput({
    name: 'editor.fontFamily',
    value: 'sans-serif',
  })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.save({ viaKeyBoard: true })
  await Editor.closeAll()
}
