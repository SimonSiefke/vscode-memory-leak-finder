import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Editor, Extensions, SideBar, Workspace }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Workspace.setFiles([])
  await SideBar.hide()

  // @ts-ignore
  await Editor.splitRight({ groupCount: 0 })
  await Editor.focusLeftEditorGroup()
  await Extensions.show()
  await Extensions.search('@builtin basics')
  await Extensions.first.shouldBe('C/C++ Language Basics')
}

export const run = async ({ Editor, ExtensionDetailView, Extensions }: TestContext): Promise<void> => {
  await Extensions.first.click()
  await ExtensionDetailView.shouldHaveHeading('C/C++ Language Basics')
  await Editor.focusRightEditorGroup()

  // @ts-ignore
  await Extensions.second.click()
  // await SideBar.hide()
  // await Extensions.show()
  // await Extensions.search('@builtin typescript')
  // await Extensions.first.shouldBe('TypeScript Language Basics')
  await new Promise(() => {})
  // TODO second editor
  await ExtensionDetailView.shouldHaveHeading('TypeScript Language Basics')
  await Editor.closeAll()
}
