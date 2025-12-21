import type { TestContext } from '../types.js'

export const skip = true

<<<<<<< HEAD
export const setup = async ({ Terminal, Workspace, SideBar }: TestContext): Promise<void> => {
  await Terminal.killAll()
  await Workspace.setFiles([
    {
      name: 'file.txt',
      content: `a`.repeat(60_000),
=======
export const setup = async ({ SideBar, Terminal, Workspace }: TestContext): Promise<void> => {
  await Terminal.killAll()
  await Workspace.setFiles([
    {
      content: `a`.repeat(60_000),
      name: 'file.txt',
>>>>>>> origin/main
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
}
