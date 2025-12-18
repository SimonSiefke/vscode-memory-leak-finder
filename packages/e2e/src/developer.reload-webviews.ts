import type { TestContext } from '../types.js'

export const skip = true

const svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="50" />
</svg>`

export const setup = async ({ Workspace, Editor, Explorer }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'a.svg',
      content: svg,
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.shouldHaveItem('a.svg')
  await Editor.open('a.svg')
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  // @ts-ignore
  await Editor.reloadWebViews({
    expectViews: ['a.svg'],
  })
}
