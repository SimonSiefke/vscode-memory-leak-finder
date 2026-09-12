import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Editor, Extensions }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Extensions.show()
  await Extensions.search('@builtin html')
  await Extensions.first.shouldBe('HTML Language Basics')
}

export const run = async ({ Editor, ExtensionDetailView, Extensions }: TestContext): Promise<void> => {
  try {
    await Extensions.first.click()
    await ExtensionDetailView.shouldHaveHeading('HTML Language Basics')
    await ExtensionDetailView.openTab('Features', { timeout: 30_000, webView: false })
    await ExtensionDetailView.openTab('Changelog', { timeout: 30_000, webView: true })
    await ExtensionDetailView.openTab('Details', { timeout: 30_000, webView: true })
  } finally {
    await Editor.closeAll()
  }
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
