import type { TestContext } from '../types.ts'

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
  await new Promise((r) => {})
  await Editor.open('test.txt')
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.type('a')
  // @ts-ignore
  await Editor.shouldHaveInlineCompletion('bcdef')
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
