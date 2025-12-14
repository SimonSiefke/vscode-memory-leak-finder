import type { TestContext } from '../types.js'

export const skip = true

export const setup = async ({ Terminal, Workspace, SideBar }: TestContext): Promise<void> => {
  await Terminal.killAll()
  await Workspace.setFiles([
    {
      name: 'file.txt',
      content: `a`.repeat(60_000),
    },
  ])
  await SideBar.hide()
  // @ts-ignore
  await Terminal.show({
    waitForReady: true,
  })
  // @ts-ignore
  await Terminal.execute('cat file.txt && touch test.txt', {
    waitForFile: 'test.txt',
  })
  await Workspace.remove('test.txt')
}

export const run = async ({ Terminal }: TestContext): Promise<void> => {
  // @ts-ignore
  await Terminal.scrollToTop()
  // @ts-ignore
  await Terminal.scrollToBottom()
  await new Promise((r) => {})
  // await Terminal.clear()
}
