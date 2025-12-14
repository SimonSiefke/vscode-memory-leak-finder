import type { TestContext } from '../types.ts'
import * as QuickPick from '../../page-object/src/parts/QuickPick/QuickPick.ts'

export const setup = async ({ Editor, Workspace, page, expect, VError }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'file.txt',
      content: 'sample text',
    },
  ])
  await Editor.closeAll()
  await Editor.open('file.txt')
  await Editor.splitRight()
  const quickPick = QuickPick.create({ expect, page, VError })
  await quickPick.executeCommand('Preferences: Open User Settings (JSON)')
  await Editor.switchToTab('settings.json')
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.openFind()
  await Editor.type('editor.fontFamily')
  await Editor.press('Escape')
  await Editor.select('editor.fontFamily')
  await Editor.press('ArrowRight')
  await Editor.press('ArrowRight')
  await Editor.press('ArrowRight')
  await Editor.press('ArrowRight')
  await Editor.press('ArrowRight')
  await Editor.press('ArrowRight')
  await Editor.press('ArrowRight')
  await Editor.press('ArrowRight')
  await Editor.press('ArrowRight')
  await Editor.press('ArrowRight')
  await Editor.press('ArrowRight')
  await Editor.press('ArrowRight')
  await Editor.press('ArrowRight')
  await Editor.press('ArrowRight')
  await Editor.press('ArrowRight')
  await Editor.press('ArrowRight')
  await Editor.press('ArrowRight')
  await Editor.press('ArrowRight')
  await Editor.press('ArrowRight')
  await Editor.press('ArrowRight')
  await Editor.selectAll()
  await Editor.type('"serif"')
  await Editor.select('"serif"')
  await Editor.selectAll()
  await Editor.type('"sans-serif"')
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.save({ viaKeyBoard: true })
  await Editor.closeAll()
}

