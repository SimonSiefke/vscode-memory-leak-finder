import type { TestContext } from '../types.js'

export const skip = 1

export const setup = async ({ Panel, Terminal, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([])
  await Panel.hide()
  await Terminal.killAll()
  await Terminal.show()
}

export const run = async ({ Terminal }: TestContext): Promise<void> => {
  // @ts-ignore
  await Terminal.restartPtyHost()
}
