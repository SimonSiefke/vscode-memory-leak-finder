import type { TestContext } from '../types.js'

export const skip = 1

export const requiresNetwork = 1

export const setup = async ({ ChatEditor, Editor, Electron, Extensions }: TestContext): Promise<void> => {
  await Electron.mockDialog({
    response: 1,
  })
  await Extensions.install({
    id: 'github copilot chat',
    name: 'GitHub Copilot Chat',
  })
  await Editor.open('index.ts')
  await Editor.shouldHaveSquigglyError()
  await Editor.splitRight()
  await ChatEditor.open()
}

export const run = async ({ ChatEditor }: TestContext): Promise<void> => {
  await ChatEditor.addContext('Problems...', 'All Problems', 'All Problems')
  // @ts-ignore
  await ChatEditor.sendMessage({
    message: `Fix the problems please`,
    verify: true,
  })
  // @ts-ignore
  await ChatEditor.clearAll()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
