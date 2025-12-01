export const create = ({ page, VError }) => {
  return {
    async focus() {
      try {
        await page.waitForIdle()
        await page.focus()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to focus window`)
      }
    },
    async blur() {
      try {
        await page.waitForIdle()
        await page.blur()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to blur window`)
      }
    },
  }
}
