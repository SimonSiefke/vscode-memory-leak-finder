import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ SideBar, Terminal, Workspace }: TestContext): Promise<void> => {
  await Terminal.killAll()
  await Workspace.setFiles([])
  await SideBar.hide()

  await Terminal.show({
    waitForReady: true,
  })
}

export const run = async ({ Terminal, Workspace }: TestContext): Promise<void> => {
  await Terminal.execute('echo test > test.txt', {
    waitForFile: 'test.txt',
  })
  await Workspace.remove('test.txt')
  await Terminal.clear()
}
