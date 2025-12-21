import type { TestContext } from '../types.js'

export const skip = true

<<<<<<< HEAD
export const setup = async ({ Terminal, Workspace, SideBar }: TestContext): Promise<void> => {
=======
export const setup = async ({ SideBar, Terminal, Workspace }: TestContext): Promise<void> => {
>>>>>>> origin/main
  await Terminal.killAll()
  await Workspace.setFiles([])
  await SideBar.hide()
  // @ts-ignore
  await Terminal.show({
    waitForReady: true,
  })
  // @ts-ignore
  await Terminal.execute('echo test > test.txt', {
    waitForFile: 'test.txt',
  })
  await Workspace.remove('test.txt')
}

export const run = async ({ Terminal }: TestContext): Promise<void> => {
  // @ts-ignore
  await Terminal.focusHover()
  // @ts-ignore
  await Terminal.ignoreHover()
}
