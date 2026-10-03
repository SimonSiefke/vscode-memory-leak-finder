import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Editor, SideBar, Terminal, Workspace }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Terminal.killAll()
  await Workspace.setFiles([])
  await SideBar.hide()

  await Terminal.show({
    waitForReady: true,
  })
  await Terminal.moveToEditorArea()
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  const newWindow = await Editor.moveToNewWindow()

  // Allow the terminal editor to finish initializing in the floating window.
  await new Promise((resolve) => setTimeout(resolve, 3000))

  await newWindow.close()

  // Allow the floating window and its terminal editor to be disposed.
  await new Promise((resolve) => setTimeout(resolve, 1000))
}

export const teardown = async ({ Editor, Terminal }: TestContext): Promise<void> => {
  await Terminal.killAll()
  await Editor.closeAll()
}
