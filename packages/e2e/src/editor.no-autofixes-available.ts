import type { TestContext } from '../types.js'

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'file.js',
      content: `abc
def`,
    },
  ])
  await Editor.open('file.js')
  await Editor.goToFile({ file: 'file.js', line: 2, column: 1 })
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.autoFix({ hasFixes: false })
  await Editor.closeAutoFix()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
