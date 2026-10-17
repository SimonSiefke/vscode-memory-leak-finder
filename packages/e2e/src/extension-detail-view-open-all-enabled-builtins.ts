import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, Extensions }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Extensions.show()
  await Extensions.search('@builtin @enabled')
}

export const run = async ({ Editor, ExtensionDetailView, Extensions }: TestContext): Promise<void> => {
  const extensionNames = await Extensions.getResultNames()
  for (const name of extensionNames) {
    await Extensions.openResult(name)
    await ExtensionDetailView.shouldHaveHeading(name)
  }
  await Editor.closeAll()
}
