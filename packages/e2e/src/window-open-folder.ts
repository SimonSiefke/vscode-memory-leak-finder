import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { TestContext } from '../types.ts'

const folderPath = join(import.meta.dirname, '..', '..', '..', '.vscode-test-open-folder-workspace')

export const setup = async (): Promise<void> => {
  await rm(folderPath, { force: true, recursive: true })
  await mkdir(folderPath, { recursive: true })
  await writeFile(join(folderPath, 'opened-file.txt'), 'content')
}

export const run = async ({ Electron, Workbench }: TestContext): Promise<void> => {
  await Electron.mockOpenDialog({
    canceled: false,
    filePaths: [folderPath],
  })
  const newWindow = await Workbench.openNewWindow()
  await newWindow.shouldBeVisible()
  await newWindow.openFolderFromExplorer()
  await newWindow.shouldHaveExplorerItem('opened-file.txt')
  await newWindow.close()
}

export const teardown = async (): Promise<void> => {
  await rm(folderPath, { force: true, recursive: true })
}