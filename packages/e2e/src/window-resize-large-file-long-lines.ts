import type { TestContext } from '../types.ts'

const InitialWindowWidth = 1000
const TargetWindowWidth = 600
const ResizeStepDelay = 16
const LineCount = 1000
const LineLength = 2000
const FileName = 'large-file-with-long-lines.txt'

const createLargeFile = () => {
  const lineSuffix = 'x'.repeat(LineLength)
  return Array.from({ length: LineCount }, (_, index) => `${index.toString().padStart(4, '0')}: ${lineSuffix}`).join('\n')
}

export const setup = async ({ Editor, Electron, SideBar, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: createLargeFile(),
      name: FileName,
    },
  ])
  await Editor.closeAll()
  await Editor.open(FileName)
  await Editor.shouldHaveBreadCrumb(FileName)
  await SideBar.hide()
  await Electron.setWindowWidth(InitialWindowWidth)
}

export const run = async ({ Electron }: TestContext): Promise<void> => {
  await Electron.setWindowWidth(InitialWindowWidth)
  await Electron.resizeWindowWidth({
    stepDelay: ResizeStepDelay,
    width: TargetWindowWidth,
  })
}

export const teardown = async ({ Editor, Electron, SideBar }: TestContext): Promise<void> => {
  await Electron.setWindowWidth(InitialWindowWidth)
  await Editor.closeAll()
  await SideBar.show()
}
