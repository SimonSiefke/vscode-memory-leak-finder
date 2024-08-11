export const create = ({ expect, page, VError }) => {
  return {
    async expandProperty(name, childProperties) {
      try {
        const hoverTree = page.locator('.debug-hover-tree')
        await expect(hoverTree).toBeVisible()
        const nameRow = hoverTree.locator(`.monaco-list-row[aria-label^="${name},"]`)
        const nameElement = nameRow.locator('.name')
        await nameElement.click()
        await expect(nameElement).toHaveAttribute('aria-expanded', 'true')
        const indexString = await nameRow.getAttribute('data-index')
        const index = parseInt(indexString)
        for (let i = 0; i < childProperties.length; i++) {
          const nextIndex = index + i + 1
          const row = hoverTree.locator(`.monaco-list-row[data-index="${nextIndex}"]`)
          const nextRowName = row.locator('.name')
          await expect(nextRowName).toHaveText(childProperties[i])
        }
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
