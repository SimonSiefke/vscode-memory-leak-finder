import type { TestContext } from '../types.ts'

export const skip = 1

const files = [
  {
    content: 'alpha',
    name: 'alpha.txt',
  },
  {
    content: 'beta',
    name: 'beta.txt',
  },
  {
    content: 'gamma',
    name: 'gamma.txt',
  },
  {
    content: 'delta',
    name: 'delta.txt',
  },
]

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles(files)
  await Editor.closeAll()
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  for (let i = 0; i < 2; i++) {
    for (const file of files) {
      await Editor.open(file.name)
      await Editor.close()
    }
  }
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
