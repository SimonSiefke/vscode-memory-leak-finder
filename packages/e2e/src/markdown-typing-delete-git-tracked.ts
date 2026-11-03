import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import * as MarkdownEditing from '../helpers/markdownEditing.ts'
import type { TestContext } from '../types.ts'

// Retains undo history intentionally; opt in for growth measurements.
export const skip = 1

let baselineText = ''

export const setup = async (context: TestContext): Promise<void> => {
  await MarkdownEditing.setup(context, { tracked: true, gitEnabled: true })
  baselineText = await readFile(join(context.Workspace.getWorkspacePath(), 'editing.md'), 'utf8')
}

export const run = async ({ Editor, Workbench, Workspace }: TestContext): Promise<void> => {
  await Editor.focus()
  await MarkdownEditing.typeCharacters(Editor)
  await Editor.save({ viaKeyBoard: false })
  await MarkdownEditing.shouldBeClean(Workbench)
  await MarkdownEditing.shouldHaveSavedText(Workspace, baselineText + MarkdownEditing.typedText)
  // Delete the inserted line with editing commands, preserving both operations
  // in history. The saved contents stay fixed without undoing the insertion.
  await Editor.press(process.platform === 'darwin' ? 'Meta+Shift+ArrowLeft' : 'Shift+Home')
  await Editor.press('Backspace')
  await Editor.save({ viaKeyBoard: false })
  await MarkdownEditing.shouldBeClean(Workbench)
  await MarkdownEditing.shouldHaveSavedText(Workspace, baselineText)
}

export const teardown = MarkdownEditing.teardown
