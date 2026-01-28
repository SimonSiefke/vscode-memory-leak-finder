import type { CreateParams } from '../CreateParams/CreateParams.ts'

export const create = ({ expect, page, VError }: CreateParams) => {
  return {
    async select(iconName: string) {
      try {
        const iconSelectorContainer = page.locator('.icon-select-box-container')
        await expect(iconSelectorContainer).toBeVisible()
        const input = iconSelectorContainer.locator('.input')
        await expect(input).toBeVisible()
        await input.type(iconName)
        const focusedIcon = page.locator('.icon-container.focused')
        await expect(focusedIcon).toBeVisible()
        const focusedWantedIcon = focusedIcon.locator(`.codicon-${iconName}`)
        await expect(focusedWantedIcon).toBeVisible()
        await focusedIcon.click()
        await expect(iconSelectorContainer).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to change icon`)
      }
    },
  }
}
