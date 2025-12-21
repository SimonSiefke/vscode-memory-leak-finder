import type { TestContext } from '../types.ts'

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
}

export const run = async ({ Terminal, Workspace }: TestContext): Promise<void> => {
  for (let i = 0; i < 50; i++) {
    const fileName = `test-${i}.txt`
    // @ts-ignore
    await Terminal.execute(`echo test > ${fileName}`, {
      waitForFile: fileName,
    })
    await Workspace.remove(fileName)
  }
  await Terminal.clear()
}
