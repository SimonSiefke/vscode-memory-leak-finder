import type { TestContext } from '../types.ts'

const InitialWindowWidth = 1000
const TargetWindowWidth = 600
const ResizeStepDelay = 16
const FileCount = 2000

const createFiles = () => {
  return Array.from({ length: FileCount }, (_, index) => ({
    content: `Content of file ${index}\n`,
    name: `file-${index.toString().padStart(4, '0')}.txt`,
  }))
}

export const setup = async ({ ActivityBar, Editor, Electron, Explorer, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles(createFiles())
  await Editor.closeAll()
  await ActivityBar.showExplorer()
  await Explorer.refresh()
  await Explorer.shouldHaveItem('file-0000.txt')
  await Electron.setWindowWidth(InitialWindowWidth)
}

export const run = async ({ Electron }: TestContext): Promise<void> => {
  await Electron.setWindowWidth(InitialWindowWidth)
  await Electron.resizeWindowWidth({
    stepDelay: ResizeStepDelay,
    width: TargetWindowWidth,
  })
}

export const teardown = async ({ Electron }: TestContext): Promise<void> => {
  await Electron.setWindowWidth(InitialWindowWidth)
}
