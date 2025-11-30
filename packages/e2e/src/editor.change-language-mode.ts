import type { TestContext } from '../types.js'

export const setup = async ({ Workspace, Editor }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'a.txt',
      content: 'a',
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
