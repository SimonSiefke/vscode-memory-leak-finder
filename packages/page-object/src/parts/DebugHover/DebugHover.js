export const create = ({ expect, page, VError }) => {
  return {
    async expandProperty(name) {
      try {
        const property = page.locator(`.debug-property[aria-label="${name}"]`)
        await expect(property).toBeVisible()
        await property.click()
      } catch (error) {
        throw new VError(error, `Failed to expand debug hover property`)
      }
    },
    async collapseProperty(name) {
      try {
        const property = page.locator(`.debug-property[aria-label="${name}"]`)
        await expect(property).toBeVisible()
        await property.click()
        await expect(property).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to collapse debug hover property`)
      }
    },
  }
}
