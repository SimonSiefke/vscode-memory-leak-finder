import type { TestContext } from '../types.ts'

export const skip = 1

// @ts-ignore
export const setup = async ({ Extensions, Editor, ExtensionDetailView }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Extensions.show()
  await Extensions.search('@builtin html')
  await Extensions.first.shouldBe('HTML Language Basics')
  await Extensions.first.click()
  await ExtensionDetailView.shouldHaveHeading('HTML Language Basics')
}

// @ts-ignore
export const run = async ({ ExtensionDetailView }: TestContext): Promise<void> => {
  await ExtensionDetailView.shouldHaveTab('Details')
  await ExtensionDetailView.openTab('Features', { webView: false, timeout: 30000 })
  await ExtensionDetailView.openTab('Changelog', { webView: true, timeout: 30000 })
  await ExtensionDetailView.openTab('Details', { webView: true, timeout: 30000 })
}
