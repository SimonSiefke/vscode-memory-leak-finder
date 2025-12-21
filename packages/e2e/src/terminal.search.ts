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
  await Terminal.type('echo abc')
  // @ts-ignore
  await Terminal.openFind()
}

export const run = async ({ Terminal }: TestContext): Promise<void> => {
  // @ts-ignore
  await Terminal.clearFindInput()
  // @ts-ignore
  await Terminal.setFindInput('abc')
  // @ts-ignore
  await Terminal.clearFindInput()
}
