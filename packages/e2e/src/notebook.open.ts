import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ Workspace, Explorer, Editor }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'file.ipynb',
      content: '',
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.shouldHaveItem('file.ipynb')
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.open('file.ipynb')
  // await new Promise((r) => {
  //   setTimeout(r, 3000)
  // })
  await Editor.closeAll()
  // await new Promise((r) => {
  //   setTimeout(r, 3000)
  // })
}
