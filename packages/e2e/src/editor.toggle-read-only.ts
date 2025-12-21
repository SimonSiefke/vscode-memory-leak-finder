import type { TestContext } from '../types.js'

<<<<<<< HEAD
export const setup = async ({ Workspace, Explorer, Editor }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'file.txt',
      content: '',
=======
export const setup = async ({ Editor, Explorer, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: '',
      name: 'file.txt',
>>>>>>> origin/main
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.shouldHaveItem('file.txt')
  await Editor.open('file.txt')
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  // @ts-ignore
  await Editor.enableReadonly()
  // @ts-ignore
  await Editor.disableReadonly()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
