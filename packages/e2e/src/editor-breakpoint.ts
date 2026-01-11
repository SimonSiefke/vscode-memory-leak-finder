import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: 'sample text',
      name: 'file.html',
    },
  ])
  await Editor.open('file.html')
  await Editor.removeAllBreakpoints()
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.toggleBreakpoint()
  await Editor.toggleBreakpoint()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
