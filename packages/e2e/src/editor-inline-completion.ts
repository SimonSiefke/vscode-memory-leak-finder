import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Editor, Extensions, Workspace }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Workspace.setFiles([
    {
      content: 'a',
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
  await Editor.shouldHaveText('a')
  await Editor.setCursor(1, 2)
  await Editor.deleteAll()
  await Editor.save({ viaKeyBoard: true })
  await Editor.closeAll()
  await Extensions.show()
  await Extensions.search(`@id:inline-completion-provider`)
  // TODO need to ensure that xtnion is running somow
  await new Promise((r) => {
    setTimeout(r, 1000021)
  })
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.type('a')
  // @ts-ignore
  await Editor.shouldHaveInlineCompletion('bcdef')
  await Editor.shouldHaveText('abcdef')
  await Editor.undo()
  await Editor.shouldHaveText('')
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.save({ viaKeyBoard: true })
  await Editor.closeAll()
}
