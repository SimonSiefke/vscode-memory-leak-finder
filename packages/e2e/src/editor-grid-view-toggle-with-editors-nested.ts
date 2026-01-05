import type { TestContext } from '../types.js'

export const skip = 1

export const setup = async ({ Editor, Workspace, SideBar }: TestContext): Promise<void> => {
  await SideBar.hide()
  // @ts-ignore
  await SideBar.hideSecondary()
  await Workspace.setFiles([
    {
      content: 'a1',
      name: 'a1.txt',
    },
    {
      content: 'a2',
      name: 'a2.txt',
    },
    {
      content: 'a3',
      name: 'a3.txt',
    },
    {
      content: 'a4',
      name: 'a4.txt',
    },
    {
      content: 'b1',
      name: 'b1.txt',
    },
    {
      content: 'b2',
      name: 'b2.txt',
    },
    {
      content: 'b3',
      name: 'b3.txt',
    },
    {
      content: 'b4',
      name: 'b4.txt',
    },
    {
      content: 'c1',
      name: 'c1.txt',
    },
    {
      content: 'c2',
      name: 'c2.txt',
    },
    {
      content: 'c3',
      name: 'c3.txt',
    },
    {
      content: 'c4',
      name: 'c4.txt',
    },
    {
      content: 'd1',
      name: 'd1.txt',
    },
    {
      content: 'd2',
      name: 'd2.txt',
    },
    {
      content: 'd3',
      name: 'd3.txt',
    },
    {
      content: 'd4',
      name: 'd4.txt',
    },
  ])

  await Editor.closeAllEditorGroups()
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.enable2x2GridView()
  await Editor.open('a1.txt')

  await Editor.shouldHaveText('a1', 'a1.txt')

  await Editor.focusRightEditorGroup()
  await Editor.open('b1.txt')

  await Editor.shouldHaveText('b1', 'b1.txt')

  await Editor.focusBottomEditorGroup()
  await Editor.open('d1.txt')

  await Editor.shouldHaveText('d1', 'd1.txt')

  await Editor.focusLeftEditorGroup()
  await Editor.open('c1.txt')
  await Editor.shouldHaveText('c1', 'c1.txt')

  await Editor.focusTopEditorGroup()
  // @ts-ignore
  await Editor.newEditorGroupRight()
  await Editor.open('a2.txt')
  await Editor.shouldHaveText('a2', 'a2.txt')

  // @ts-ignore
  await Editor.newEditorGroupBottom()
  await Editor.open('a4.txt')
  await Editor.shouldHaveText('a4', 'a4.txt')

  await Editor.focusLeftEditorGroup()
  // @ts-ignore
  await Editor.newEditorGroupBottom()
  await Editor.open('a3.txt')
  await Editor.shouldHaveText('a3', 'a3.txt')

  await new Promise((r) => {})
  await Editor.closeAllEditorGroups()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAllEditorGroups()
}
