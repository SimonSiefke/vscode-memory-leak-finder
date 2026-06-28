import type { TestContext } from '../types.ts'

export const skip = process.platform === 'darwin'

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: 'let x: string = 1',
      name: 'file.ts',
    },
  ])
  await Editor.closeAll()
  await Editor.open('file.ts')
  await Editor.shouldHaveBreadCrumb('file.ts')
}

export const run = async ({ Editor, Hover }: TestContext): Promise<void> => {
  await Editor.shouldHaveText('let x: string = 1')
  await Editor.shouldHaveSquigglyError()
  await Editor.setCursor(1, 5)
  await Editor.hover(/let x: string/)
  await Hover.shouldHaveActions()
  await Hover.hide()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
