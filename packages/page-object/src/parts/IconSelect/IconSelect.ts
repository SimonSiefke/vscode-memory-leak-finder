export const create = ({ page, expect, VError }) => {
  return {
    async select(iconName) {
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
