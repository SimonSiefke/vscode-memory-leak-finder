import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Editor, ExtensionDetailView, Extensions }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Extensions.show()
  await Extensions.search('@builtin html')
  await Extensions.first.shouldBe('HTML Language Basics')
  await Extensions.first.click()
  await ExtensionDetailView.shouldHaveHeading('HTML Language Basics')
}

export const run = async ({ ExtensionDetailView }: TestContext): Promise<void> => {
  await ExtensionDetailView.shouldHaveTab('Details')
  await ExtensionDetailView.openTab('Features', { timeout: 30_000, webView: false })
  await ExtensionDetailView.openTab('Changelog', { timeout: 30_000, webView: true })
  await ExtensionDetailView.openTab('Details', { timeout: 30_000, webView: true })
}
