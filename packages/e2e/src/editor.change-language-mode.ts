import type { TestContext } from '../types.js'

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: 'a',
      name: 'a.txt',
    },
  ])
  await Editor.closeAll()
  await Editor.open('a.txt')
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  // @ts-ignore
  await Editor.setLanguageMode('Clojure')
  // @ts-ignore
  await Editor.setLanguageMode('Plain Text')
}

export const teardown = async ({ Editor }: TestContext) => {
  await Editor.closeAll()
}
