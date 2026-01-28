import type { TestContext } from '../types.js'

export const skip = 1

export const setup = async ({ Editor, SideBar }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SideBar.hide()
}

export const run = async ({ ChatEditor, Editor }: TestContext): Promise<void> => {
  await ChatEditor.open()
  // @ts-ignore
  await Editor.splitDown({ groupCount: 0, splitInto: true })
  await Editor.closeAll()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
