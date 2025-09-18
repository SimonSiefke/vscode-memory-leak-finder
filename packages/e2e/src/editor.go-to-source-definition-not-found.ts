import type { TestContext } from '../types.js'

export const skip = true

export const setup = async ({  Editor, Workspace  }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'tsconfig.json',
      content: `{}
`,
    },
    {
      name: 'file.ts',
      content: `abc
def`,
    },
  ])
  await Editor.open('file.ts')
}

export const run = async ({  Editor, Notification  }: TestContext): Promise<void> => {
  await Editor.goToSourceDefinition({ hasDefinition: false })
  await Notification.closeAll()
}

export const teardown = async ({  Editor  }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
