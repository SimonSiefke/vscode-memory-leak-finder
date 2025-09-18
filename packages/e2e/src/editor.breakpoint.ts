import type { TestContext } from '../types.js'

export const skip = true

export const setup = async ({  Workspace, Editor  }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'file.html',
      content: 'sample text',
    },
  ])
  await Editor.open('file.html')
  await Editor.removeAllBreakpoints()
}

export const run = async ({  Editor  }: TestContext): Promise<void> => {
  await Editor.toggleBreakpoint()
  await Editor.toggleBreakpoint()
}

export const teardown = async ({  Editor  }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
