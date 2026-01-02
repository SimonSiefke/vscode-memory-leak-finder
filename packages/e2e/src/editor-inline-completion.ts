import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, Extensions, Workspace }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Workspace.setFiles([
    {
      content: '',
      name: 'test.txt',
    },
  ])
  await Extensions.add('.vscode-extensions-source/inline-completion-provider', 'inline-completion-provider')
  await Editor.open('test.txt')
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.type('a')
  await Editor.shouldHaveInlineCompletion('bcdef')
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}

