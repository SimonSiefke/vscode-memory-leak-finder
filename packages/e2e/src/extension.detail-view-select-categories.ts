import type { TestContext } from '../types.ts'

export const skip = true

<<<<<<< HEAD
export const setup = async ({ Extensions, Editor, ExtensionDetailView }: TestContext): Promise<void> => {
=======
export const setup = async ({ Editor, ExtensionDetailView, Extensions }: TestContext): Promise<void> => {
>>>>>>> origin/main
  await Editor.closeAll()
  await Extensions.show()
  await Extensions.search('@builtin html')
  await Extensions.first.shouldBe('HTML Language Basics')
  await Extensions.first.click()
  await ExtensionDetailView.shouldHaveHeading('HTML Language Basics')
  await ExtensionDetailView.shouldHaveTab('Details')
}

export const run = async ({ ExtensionDetailView, Extensions }: TestContext): Promise<void> => {
  await ExtensionDetailView.selectCategory('Programming Languages')
  await Extensions.shouldHaveValue('@category:"Programming Languages"')
  // @ts-ignore
  await Extensions.waitForProgressToBeHidden()
  await Extensions.clear()
}
