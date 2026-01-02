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

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.splitRight()

  await Editor.focusLeftEditorGroup()
  await Editor.type('left ')

  // @ts-ignore
  await Editor.shouldHaveText('left initial text', 'file.txt', 1)
  // @ts-ignore
  await Editor.shouldHaveText('left initial text', 'file.txt', 2)

  await Editor.focusRightEditorGroup()
  await Editor.type('right ')
  await new Promise((r) => {})
  // await page.waitForIdle()

  // const rightText = 'left right initial text'.replaceAll(' ', nonBreakingSpace)
  // await expect(leftEditorLines).toHaveText(rightText)
  // await expect(rightEditorLines).toHaveText(rightText)
}
