import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ Terminal, Workspace, SideBar }: TestContext): Promise<void> => {
  await Terminal.killAll()
  await Workspace.setFiles([])
  await SideBar.hide()
  await Terminal.show()
}

export const run = async ({ Terminal }: TestContext): Promise<void> => {
  await Terminal.execute('echo test > test.txt')
  await Terminal.clear()
}
