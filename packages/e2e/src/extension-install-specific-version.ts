import type { TestContext } from '../types.ts'

export const skip = true

export const requiresNetwork = true

export const setup = async ({ Editor, Extensions }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Extensions.show()
  await Extensions.search('esbenp.prettier-vscode')
  await Extensions.first.shouldBe('Prettier - Code formatter')
}

export const run = async ({ ContextMenu, Extensions, QuickPick }: TestContext): Promise<void> => {
  await Extensions.first.openContextMenu()
  await ContextMenu.select('Install Specific Version...')

  const quickPickItems = await QuickPick.getVisibleCommands()
  if (quickPickItems.length < 2) {
    throw new Error(`Expected install specific version quick pick to show multiple versions, but got ${quickPickItems.length} items`)
  }

  const versionItems = quickPickItems.filter((item) => /\d+\.\d+\.\d+/.test(item))
  if (versionItems.length === 0) {
    throw new Error(`Expected install specific version quick pick to contain version items, but got: ${quickPickItems.join(', ')}`)
  }

  await QuickPick.close()
}
