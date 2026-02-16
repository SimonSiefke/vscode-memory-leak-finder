import type { TestContext } from '../types.ts'

const isThemeActionItem = (label: string): boolean => {
  return /additional file icon themes/i.test(label)
}

const focusNextTheme = async (QuickPick: TestContext['QuickPick'], currentTheme: string): Promise<string> => {
  for (let i = 0; i < 10; i++) {
    await QuickPick.focusNext()
    const nextLabel = await QuickPick.getFocusedItemLabel()
    if (nextLabel !== currentTheme && !isThemeActionItem(nextLabel)) {
      return nextLabel
    }
  }
  throw new Error(`Could not find next file icon theme in quick pick`)
}

export const run = async ({ QuickPick }: TestContext): Promise<void> => {
  await QuickPick.showFileIconTheme()
  const firstTheme = await QuickPick.getFocusedItemLabel()

  const secondTheme = await focusNextTheme(QuickPick, firstTheme)
  if (secondTheme === firstTheme) {
    throw new Error(`Expected second icon theme to be different from initial icon theme`)
  }
  await QuickPick.pressEnter()

  await QuickPick.showFileIconTheme()
  const appliedSecondTheme = await QuickPick.getFocusedItemLabel()
  if (appliedSecondTheme !== secondTheme) {
    throw new Error(`Expected icon theme "${secondTheme}" to be applied, but got "${appliedSecondTheme}"`)
  }

  const thirdTheme = await focusNextTheme(QuickPick, secondTheme)
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
