import type { TestContext } from '../types.js'

export const skip = true

export const setup = async ({ Terminal, Workspace, SideBar }: TestContext): Promise<void> => {
  await Terminal.killAll()
  await Workspace.setFiles([
    {
      name: 'file.txt',
      content: `a`.repeat(20_000),
    },
  ])
  await SideBar.hide()
  // @ts-ignore
  await Terminal.show({
    waitForReady: true,
  })
}

export const run = async ({ Terminal, Workspace }: TestContext): Promise<void> => {
  // @ts-ignore
  await Terminal.execute('cat file.txt && touch test.txt', {
    waitForFile: 'test.txt',
  })
  await Workspace.remove('test.txt')
  // await Terminal.clear()
}
