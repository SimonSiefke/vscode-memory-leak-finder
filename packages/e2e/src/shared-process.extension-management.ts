import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, Extensions }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Extensions.show()
}

export const run = async ({ Extensions, Editor }: TestContext): Promise<void> => {
  // Open extensions view (triggers shared-process communication)
  await Extensions.show()

  // Search for built-in extensions (communicates with shared-process)
  await Extensions.search('@builtin typescript')
  await Extensions.search('@builtin javascript')
  await Extensions.search('@builtin html')
  await Extensions.search('@builtin css')

  // Search for more extensions to increase shared-process activity
  await Extensions.search('@builtin json')
  await Extensions.search('@builtin markdown')

  // Search for all builtin extensions
  await Extensions.search('@builtin')

  // Close extensions view
  await Extensions.hide()

  // Reopen to verify state
  await Extensions.show()
  await Extensions.search('@builtin typescript')
  await Extensions.hide()
}
