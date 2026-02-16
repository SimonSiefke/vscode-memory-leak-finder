import type { TestContext } from '../types.ts'

export const run = async ({ QuickPick }: TestContext): Promise<void> => {
  await QuickPick.showFileIconTheme()
  const firstTheme = await QuickPick.getFocusedItemLabel()

  await QuickPick.focusNext()
  const secondTheme = await QuickPick.getFocusedItemLabel()
  if (secondTheme === firstTheme) {
    throw new Error(`Expected second icon theme to be different from initial icon theme`)
  }
  await QuickPick.pressEnter()

  await QuickPick.showFileIconTheme()
  const appliedSecondTheme = await QuickPick.getFocusedItemLabel()
  if (appliedSecondTheme !== secondTheme) {
    throw new Error(`Expected icon theme "${secondTheme}" to be applied, but got "${appliedSecondTheme}"`)
  }

  await QuickPick.focusNext()
  const thirdTheme = await QuickPick.getFocusedItemLabel()
  if (thirdTheme === secondTheme) {
    throw new Error(`Expected third icon theme to be different from second icon theme`)
  }
  await QuickPick.pressEnter()

  await QuickPick.showFileIconTheme()
  const appliedThirdTheme = await QuickPick.getFocusedItemLabel()
  if (appliedThirdTheme !== thirdTheme) {
    throw new Error(`Expected icon theme "${thirdTheme}" to be applied, but got "${appliedThirdTheme}"`)
  }

  await QuickPick.hide()
}
