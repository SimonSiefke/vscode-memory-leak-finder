import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: `abc
def`,
      name: 'file.js',
    },
  ])
  await Editor.open('file.js')
  await Editor.goToFile({ column: 1, file: 'file.js', line: 2 })
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.autoFix({ hasFixes: false })
  await Editor.closeAutoFix()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
