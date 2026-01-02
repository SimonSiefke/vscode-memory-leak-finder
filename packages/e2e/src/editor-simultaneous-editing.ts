import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: 'initial text',
      name: 'file.txt',
    },
  ])
  await Editor.closeAll()
  await Editor.open('file.txt')
  await Editor.shouldHaveText('initial text')
}

// @ts-ignore
export const run = async ({ Editor, page, expect }: TestContext): Promise<void> => {
  await Editor.splitRight()
  const editors = page.locator('.editor-instance')
  await expect(editors).toHaveCount(2)

  const leftEditor = editors.first()
  const rightEditor = editors.last()

  await Editor.focusLeftEditorGroup()
  await Editor.type('left ')
  await page.waitForIdle()

  const leftEditorLines = leftEditor.locator('.view-lines')
  const rightEditorLines = rightEditor.locator('.view-lines')
  const nonBreakingSpace = String.fromCharCode(160)
  const leftText = 'left initial text'.replaceAll(' ', nonBreakingSpace)
  await expect(leftEditorLines).toHaveText(leftText)
  await expect(rightEditorLines).toHaveText(leftText)

  await Editor.focusRightEditorGroup()
  await Editor.type('right ')
  await page.waitForIdle()

  const rightText = 'left right initial text'.replaceAll(' ', nonBreakingSpace)
  await expect(leftEditorLines).toHaveText(rightText)
  await expect(rightEditorLines).toHaveText(rightText)
}

