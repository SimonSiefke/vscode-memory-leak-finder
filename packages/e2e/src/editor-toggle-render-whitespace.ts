import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Editor, SettingsEditor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: 'a  b\n',
      name: 'file.txt',
    },
  ])
  await Editor.closeAll()
  await Editor.open('file.txt')
  await Editor.splitRight()
  await SettingsEditor.open()
  await SettingsEditor.search({
    resultCount: 1,
    value: 'editor.renderWhitespace',
  })
}

export const run = async ({ Editor, SettingsEditor }: TestContext): Promise<void> => {
  await SettingsEditor.select({
    name: 'editor.renderWhitespace',
    value: 'all',
  })
  // @ts-ignore
  await Editor.shouldHaveVisibleWhitespace('file.txt')

  await SettingsEditor.select({
    name: 'editor.renderWhitespace',
    value: 'none',
  })
  // @ts-ignore
  await Editor.shouldNotHaveVisibleWhitespace('file.txt')
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
