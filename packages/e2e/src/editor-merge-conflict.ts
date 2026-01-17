import type { TestContext } from '../types.js'

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: `<<<<<<< HEAD
console.log("This is the current branch version");
=======
console.log("This is the incoming branch version");
>>>>>>> branch-name
`,
      name: 'merge-conflict.js',
    },
  ])
  await Editor.closeAll()
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.open('merge-conflict.js')
  await Editor.shouldHaveCodeLens({ timeout: 20_000 })
  await Editor.closeAll()
}

export const teardown = async ({ Editor }: TestContext) => {
  await Editor.closeAll()
}
