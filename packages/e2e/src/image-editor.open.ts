import type { TestContext } from '../types.js'

export const skip = true

const svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="50" />
</svg>`

export const setup = async ({ Editor, Explorer, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: svg,
      name: 'a.svg',
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.shouldHaveItem('a.svg')
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.open('a.svg')
  await Editor.close()
}
