export const create = ({ page, expect, VError, ideVersion }) => {
  return {
    async setSearchValue() {
      try {
        await page.waitForIdle()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to set search value`)
      }
    },
    async setReplaceValue() {
      try {
        await page.waitForIdle()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to set replace value`)
      }
    },
    async replace() {
      try {
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to replace`)
      }
    },
  }
}
