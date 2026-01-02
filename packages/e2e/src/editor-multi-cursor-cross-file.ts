import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: `function hello() {
  console.log('hello')
  return true
}`,
      name: 'file1.ts',
    },
    {
      content: `function world() {
  console.log('world')
  return false
}`,
      name: 'file2.ts',
    },
  ])
  await Editor.closeAll()
  await Editor.open('file1.ts')
  await Editor.open('file2.ts')
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.splitRight()

  const leftEditor = editors.first()
  const rightEditor = editors.last()

  await Editor.focusLeftEditorGroup()
  await Editor.switchToTab('file1.ts')
  await Editor.setCursor(2, 2)

  await page.keyboard.down('Alt')
  const leftEditorContent = leftEditor.locator('.view-lines')
  const line3Left = leftEditorContent.locator('.view-line').nth(2)
  await line3Left.click()
  await page.keyboard.up('Alt')

  await page.waitForIdle()

  await Editor.type('const x = ')

  await page.waitForIdle()

  const leftEditorLines = leftEditor.locator('.view-lines')
  const nonBreakingSpace = String.fromCharCode(160)
  const leftText = `function hello() {
  const x = console.log('hello')
  const x = return true
}`.replaceAll(' ', nonBreakingSpace)

  await expect(leftEditorLines).toHaveText(leftText)

  await Editor.focusRightEditorGroup()
  await Editor.switchToTab('file2.ts')
  await Editor.setCursor(2, 2)

  await page.keyboard.down('Alt')
  const rightEditorContent = rightEditor.locator('.view-lines')
  const line3Right = rightEditorContent.locator('.view-line').nth(2)
  await line3Right.click()
  await page.keyboard.up('Alt')

  await page.waitForIdle()

  await Editor.type('const y = ')

  await page.waitForIdle()

  const rightEditorLines = rightEditor.locator('.view-lines')
  const rightText = `function world() {
  const y = console.log('world')
  const y = return false
}`.replaceAll(' ', nonBreakingSpace)

  await expect(rightEditorLines).toHaveText(rightText)
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
