import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Editor, SettingsEditor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: 'sample text',
      name: 'file.txt',
    },
  ])
  await Editor.closeAll()
  await Editor.open('file.txt')
  await Editor.splitRight()
  await SettingsEditor.open()
  await SettingsEditor.search({
    resultCount: 6,
    value: 'editor.fontFamily',
  })
}

export const run = async ({ Editor, SettingsEditor }: TestContext): Promise<void> => {
  await SettingsEditor.setTextInput({
    name: 'editor.fontFamily',
    value: 'serif',
  })
  // @ts-ignore
  await Editor.shouldHaveFontFamily('serif')
  await SettingsEditor.setTextInput({
    name: 'editor.fontFamily',
    value: 'sans-serif',
  })
  // @ts-ignore
  await Editor.shouldHaveFontFamily('sans-serif')
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.save({ viaKeyBoard: true })
  await Editor.closeAll()
}
