import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import * as MarkdownEditing from './markdownEditing.ts'
import type { TestContext } from '../types.ts'

let expectedText = ''

export const setup = async (context: TestContext, options: Parameters<typeof MarkdownEditing.setup>[1]): Promise<void> => {
  await MarkdownEditing.setup(context, options)
  expectedText = await readFile(join(context.Workspace.getWorkspacePath(), 'editing.md'), 'utf8')
}

export const run = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  // Preserve all previous edits, including the undo history, across iterations.
  await Editor.focus()
  await Editor.typeCharacters(MarkdownEditing.typedText)
  expectedText += MarkdownEditing.typedText
  await Editor.save({ viaKeyBoard: false })
  await MarkdownEditing.shouldHaveSavedText(Workspace, expectedText)
}

export const teardown = MarkdownEditing.teardown
