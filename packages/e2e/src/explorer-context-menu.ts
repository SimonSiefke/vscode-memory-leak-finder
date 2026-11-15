import type { TestContext } from '../types.ts'

export const skip = process.platform === 'darwin'

// Flaky menu visibility on Linux CI, including repeated runs; keep runnable locally.
// https://github.com/SimonSiefke/vscode-memory-leak-finder/actions/runs/41893151874/job/126798192348
export const skipInCi = process.platform === 'linux'

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: 'a',
      name: 'a.txt',
    },
    {
      content: 'b',
      name: 'b.txt',
    },
  ])
  await Editor.closeAll()
}

export const run = async ({ ContextMenu, Explorer }: TestContext): Promise<void> => {
  await Explorer.focus()
  await Explorer.shouldHaveItem('a.txt')
  await Explorer.shouldHaveItem('b.txt')
  await Explorer.focus()
  await Explorer.openContextMenu('a.txt')
  await ContextMenu.select('Select for Compare')
}
