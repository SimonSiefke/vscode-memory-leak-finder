import type { TestContext } from '../types.js'

export const skip = true

// @ts-ignore
export const setup = async ({ Extensions, Editor, ExtensionDetailView }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Extensions.show()
  await Extensions.search('@builtin html')
  await Extensions.first.shouldBe('HTML Language Basics')
  await Extensions.first.click()
  await ExtensionDetailView.shouldHaveHeading('HTML Language Basics')
  await ExtensionDetailView.shouldHaveTab('Details')
}

// @ts-ignore
export const run = async ({ ExtensionDetailView, Extensions }: TestContext): Promise<void> => {
  await ExtensionDetailView.selectCategory('Programming Languages')
  await Extensions.shouldHaveValue('@category:"Programming Languages"')
  await Extensions.clear()
}
