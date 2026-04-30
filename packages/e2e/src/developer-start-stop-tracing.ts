import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Electron }: TestContext): Promise<void> => {
  await Electron.mockElectron('contentTracing', 'startRecording', '() => Promise.resolve()')
  await Electron.mockElectron('contentTracing', 'stopRecording', `() => Promise.resolve('/tmp/vscode-memory-leak-finder.trace.txt')`)
  await Electron.mockElectron('shell', 'showItemInFolder', '() => {}')
  await Electron.mockDialog({ response: 0 })
}

export const run = async ({ Developer }: TestContext): Promise<void> => {
  // @ts-ignore
  await Developer.startTracing()
  // @ts-ignore
  await Developer.stopTracing()
}

export const teardown = async ({ Electron }: TestContext): Promise<void> => {
  // @ts-ignore
  await Electron.unmockElectron('contentTracing', 'startRecording')
  // @ts-ignore
  await Electron.unmockElectron('contentTracing', 'stopRecording')
  // @ts-ignore
  await Electron.unmockElectron('shell', 'showItemInFolder')
  // @ts-ignore
  await Electron.unmockElectron('dialog', 'showMessageBox')
}
