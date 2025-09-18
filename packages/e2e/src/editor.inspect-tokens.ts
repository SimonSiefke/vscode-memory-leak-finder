import type { TestContext } from '../types.js'

export const setup = async ({  Editor, Workspace  }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'file.css',
      content: `h1 {
  font-size: 20px;
}
`,
    },
  ])
  await Editor.closeAll()
  await Editor.open('file.css')
  await Editor.shouldHaveText(`h1 {
  font-size: 20px;
}
`)
  await Editor.shouldHaveCursor('0px')
}

export const run = async ({  Editor  }: TestContext): Promise<void> => {
  await Editor.inspectTokens()
  await Editor.shouldHaveInspectedToken('h12 chars')
  await Editor.closeInspectedTokens()
}

export const teardown = async ({  Editor  }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
