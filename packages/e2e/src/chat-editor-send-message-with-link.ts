import type { TestContext } from '../types.js'

export const skip = 1

export const requiresNetwork = true

export const setup = async ({ ChatEditor, Electron, Extensions }: TestContext): Promise<void> => {
  await Electron.mockDialog({
    response: 1,
  })
  // @ts-ignore
  await Extensions.install({
    id: 'github copilot chat',
    name: 'GitHub Copilot Chat',
  })
  // @ts-ignore
  await ChatEditor.clearAll()
  await ChatEditor.open()
}

export const run = async ({ ChatEditor }: TestContext): Promise<void> => {
  // @ts-ignore
  await ChatEditor.sendMessage({
    message: `What is displayed on https://example.com`,
    verify: true,
  })
  // @ts-ignore
  await ChatEditor.clearAll()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
