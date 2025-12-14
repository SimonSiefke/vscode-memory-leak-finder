import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'file.txt',
      content: 'sample text',
    },
  ])
  await Editor.closeAll()
  await Editor.open('file.txt')
  await Editor.splitRight()
  await Editor.openSettingsJson()
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.openFind()
  await Editor.type('editor.fontFamily')
  await Editor.press('Escape')
  await Editor.select('editor.fontFamily')
  await Editor.press('End')
  await Editor.press('ArrowLeft')
  await Editor.press('Control+Shift+ArrowLeft')
  await Editor.selectAll()
  await Editor.type('"serif"')
  await Editor.select('"serif"')
  await Editor.selectAll()
  await Editor.type('"sans-serif"')
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.save({ viaKeyBoard: true })
  await Editor.closeAll()
}
