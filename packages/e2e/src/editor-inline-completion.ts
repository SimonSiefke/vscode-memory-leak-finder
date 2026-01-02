import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, Extensions, Workspace }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Workspace.setFiles([
    {
      content: 'test ',
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
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.shouldHaveText('test ')
  await Editor.setCursor(1, 5)
  await Editor.type('a')
  await new Promise((r) => {})
  // @ts-ignore
  await Editor.shouldHaveInlineCompletion('bcdef')
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
