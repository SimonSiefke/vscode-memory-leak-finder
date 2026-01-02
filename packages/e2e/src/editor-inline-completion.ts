import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Editor, Extensions, Workspace }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Workspace.setFiles([
    {
      content: '',
      name: 'test.txt',
    },
  ])
  // @ts-ignore
  await Extensions.add({
    path: '.vscode-extensions-source/inline-completion-provider',
    expectedName: 'inline-completion-provider',
  })
  await Editor.open('test.txt')
  await Editor.shouldHaveBreadCrumb('test.txt')
  await Editor.shouldHaveText('')
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.setCursor(1, 1)
  await Editor.type('a')
  await Editor.shouldHaveText('abcdef')
  // @ts-ignore
  await Editor.shouldHaveInlineCompletion('bcdef')
  await Editor.undo()
  await Editor.shouldHaveText('')
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.save({ viaKeyBoard: true })
  await Editor.closeAll()
}
