import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Editor, Extensions, Workspace, SideBar }: TestContext): Promise<void> => {
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
  await Extensions.show()
  await Extensions.search(`@id:e2e-tests.inline-completion-provider`)
  await Extensions.first.shouldHaveActivationTime()
  await SideBar.hide()
  await Editor.goToFile({
    column: 1,
    file: 'test.txt',
    line: 1,
  })
  await Editor.shouldHaveText('a')
  await Editor.deleteAll()
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.type('a')
  // @ts-ignore
  await Editor.shouldHaveInlineCompletion('bcdef')
  await Editor.shouldHaveText('abcdef')
  await Editor.deleteAll()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.save({ viaKeyBoard: true })
  await Editor.closeAll()
}
