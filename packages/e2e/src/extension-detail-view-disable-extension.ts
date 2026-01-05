import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Editor, ExtensionDetailView, Extensions }: TestContext): Promise<void> => {
  await Editor.closeAll()
  // @ts-ignore
  await Extensions.open({
    id: 'vscode.html-language-features',
    name: 'HTML Language Features',
  })
  await ExtensionDetailView.shouldHaveHeading('HTML Language Features')
  await ExtensionDetailView.shouldHaveTab('Details')
  await ExtensionDetailView.enableExtension({ force: true })
}

export const run = async ({ ExtensionDetailView }: TestContext): Promise<void> => {
  await ExtensionDetailView.disableExtension()

  // @ts-ignore
  await ExtensionDetailView.enableExtension()
}
