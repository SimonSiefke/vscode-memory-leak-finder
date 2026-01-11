import type { TestContext } from '../types.js'

export const skip = true

export const setup = async ({ SideBar, Terminal, Workspace }: TestContext): Promise<void> => {
  await Terminal.killAll()
  await Workspace.setFiles([
    {
      content: `a`.repeat(60_000),
      name: 'file.txt',
    },
  ])
  await SideBar.hide()

  await Terminal.show({
    waitForReady: true,
  })

  await Terminal.execute('cat file.txt && touch test.txt', {
    waitForFile: 'test.txt',
  })
  await Workspace.remove('test.txt')
}

export const run = async ({ Terminal }: TestContext): Promise<void> => {
  await Terminal.scrollToTop()

  await Terminal.scrollToBottom()
}
