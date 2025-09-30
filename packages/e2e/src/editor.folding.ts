import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'file.css',
      content: `h1 {
  font-size: 20px
}

h2 {
  font-size: 15px;
}`,
    },
  ])
  await Editor.open('file.css')
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  // @ts-ignore
  await Editor.fold()
  // @ts-ignore
  await Editor.unfold()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
