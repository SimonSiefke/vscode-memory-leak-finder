import type { TestContext } from '../types.js'

export const skip = true

export const setup = async ({ Editor, SideBar, Terminal, Workspace }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Terminal.killAll()
  await Workspace.setFiles([])
  await SideBar.hide()
  // @ts-ignore
  await Terminal.show({
    waitForReady: true,
  })
}

export const run = async ({ Terminal }: TestContext): Promise<void> => {
  // @ts-ignore
  await Terminal.moveToEditorArea()
  // @ts-ignore
  await Terminal.moveToPanelArea()
}
