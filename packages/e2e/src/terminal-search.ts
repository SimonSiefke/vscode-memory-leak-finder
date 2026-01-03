import type { TestContext } from '../types.js'

export const skip = true

export const setup = async ({ SideBar, Terminal, Workspace }: TestContext): Promise<void> => {
  await Terminal.killAll()
  await Workspace.setFiles([])
  await SideBar.hide()

  await Terminal.show({
    waitForReady: true,
  })

  await Terminal.type('echo abc')

  await Terminal.openFind()
}

export const run = async ({ Terminal }: TestContext): Promise<void> => {
  await Terminal.clearFindInput()

  await Terminal.setFindInput('abc')

  await Terminal.clearFindInput()
}
