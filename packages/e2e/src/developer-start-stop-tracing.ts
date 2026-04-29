import type { TestContext } from '../types.ts'

export const setup = async ({ Electron }: TestContext): Promise<void> => {
  await Electron.mockElectron('contentTracing', 'startRecording', '() => Promise.resolve()')
  await Electron.mockElectron('contentTracing', 'stopRecording', `() => Promise.resolve('/tmp/vscode-memory-leak-finder.trace.txt')`)
  await Electron.mockElectron('shell', 'showItemInFolder', '() => {}')
  await Electron.mockDialog({ response: 0 })
}

export const run = async ({ Developer }: TestContext): Promise<void> => {
  await Developer.startTracing()
  await Developer.stopTracing()
}

export const teardown = async ({ Electron }: TestContext): Promise<void> => {
  await Electron.unmockElectron('contentTracing', 'startRecording')
  await Electron.unmockElectron('contentTracing', 'stopRecording')
  await Electron.unmockElectron('shell', 'showItemInFolder')
  await Electron.unmockElectron('dialog', 'showMessageBox')
}
