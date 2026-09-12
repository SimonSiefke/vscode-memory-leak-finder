import type { TestContext } from '../types.ts'

const InitialWindowWidth = 1000
const TargetWindowWidth = 600
const ResizeStepDelay = 16
const EditorCount = 20

const createFiles = () => {
  return Array.from({ length: EditorCount }, (_, index) => ({
    content: `Content of editor ${index}\n`,
    name: `editor-${index.toString().padStart(2, '0')}.txt`,
  }))
}

export const setup = async ({ Editor, Electron, Workspace }: TestContext): Promise<void> => {
  const files = createFiles()
  await Workspace.setFiles(files)
  await Editor.closeAll()
  for (const file of files) {
    await Editor.open(file.name)
  }
  await Electron.setWindowWidth(InitialWindowWidth)
}

export const run = async ({ Electron }: TestContext): Promise<void> => {
  await Electron.setWindowWidth(InitialWindowWidth)
  await Electron.resizeWindowWidth({
    stepDelay: ResizeStepDelay,
    width: TargetWindowWidth,
  })
}

export const teardown = async ({ Editor, Electron }: TestContext): Promise<void> => {
  await Electron.setWindowWidth(InitialWindowWidth)
  await Editor.closeAll()
}
