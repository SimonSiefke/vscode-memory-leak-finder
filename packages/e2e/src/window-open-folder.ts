import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { TestContext } from '../types.ts'

const folderPath = join(import.meta.dirname, '..', '..', '..', '.vscode-test-open-folder-workspace')

export const skip = 1

export const setup = async (): Promise<void> => {
  await rm(folderPath, { force: true, recursive: true })
  await mkdir(folderPath, { recursive: true })
  await writeFile(join(folderPath, 'opened-file.txt'), 'content')
}

export const run = async ({ Electron, Explorer, Workbench }: TestContext): Promise<void> => {
  await Electron.mockOpenDialog({
    canceled: false,
    filePaths: [folderPath],
  })
  // @ts-ignore
  await Workbench.openFolder()
  await Explorer.shouldHaveItem('opened-file.txt')
}

export const teardown = async (): Promise<void> => {
  await rm(folderPath, { force: true, recursive: true })
}
