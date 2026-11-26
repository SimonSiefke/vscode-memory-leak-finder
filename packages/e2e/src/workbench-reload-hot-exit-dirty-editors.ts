import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { TestContext } from '../types.ts'
import * as HotExit from '../helpers/hotExit.ts'

const fileName = 'file.txt'
const fileContent = 'hello from hot exit test'
const untitledName = 'Untitled-1'

export const skip = 1

let cycle = 0

const shouldHaveUnchangedFileOnDisk = async (Workspace: TestContext['Workspace']): Promise<void> => {
  assert.equal(await readFile(join(Workspace.getWorkspacePath(), fileName), 'utf8'), fileContent)
}

export const setup = async (context: TestContext): Promise<void> => {
  const { Editor, Explorer, Workspace } = context
  await Workspace.setFiles([
    {
      content: fileContent,
      name: fileName,
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.shouldHaveItem(fileName)
  await Editor.open(fileName)
  await HotExit.enable(context)
  await Editor.closeAll()
}

export const run = async ({ Editor, Workbench, Workspace }: TestContext): Promise<void> => {
  cycle++
  const fileMarker = `hot-exit-file-${cycle}-end`
  const untitledMarker = `hot-exit-untitled-${cycle}-end`
  const dirtyFileText = `${fileMarker} ${fileContent}`

  await Editor.open(fileName)
  await Editor.shouldHaveText(fileContent, fileName)
  await Editor.type(`${fileMarker} `)
  await Editor.shouldHaveText(dirtyFileText, fileName)
  await Editor.newTextFile()
  await Editor.type(untitledMarker)
  await Editor.shouldHaveText(untitledMarker, untitledName)
  await Editor.shouldHaveDirtyTabs([fileName, untitledName])
  await HotExit.waitForBackups([fileMarker, untitledMarker], { present: true })

  await Workbench.reload()

  await Editor.shouldHaveDirtyTabs([fileName, untitledName])
  await Editor.switchToTab(untitledName)
  await Editor.shouldHaveText(untitledMarker, untitledName)
  await Editor.switchToTab(fileName)
  await Editor.shouldHaveText(dirtyFileText, fileName)
  await shouldHaveUnchangedFileOnDisk(Workspace)

  await Editor.revertAndClose()
  await Editor.switchToTab(untitledName)
  await Editor.revertAndClose()
  await Editor.shouldHaveDirtyTabs([])
  await HotExit.waitForBackups([fileMarker, untitledMarker], { present: false })
  await shouldHaveUnchangedFileOnDisk(Workspace)
}

export const teardown = async (context: TestContext): Promise<void> => {
  const { Editor } = context
  try {
    await Editor.open(fileName)
    await Editor.shouldHaveMinimap()
  } finally {
    await HotExit.restore(context)
  }
  await Editor.closeAll()
}
