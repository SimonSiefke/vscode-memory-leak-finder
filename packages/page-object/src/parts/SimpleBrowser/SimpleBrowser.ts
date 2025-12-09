export const create = ({ page, expect, VError, ideVersion }) => {
  return {
    async show(url) {
      try {
        // TODO maybe create a mock http server
        // with a custom index html file to use
        // as url
        await page.waitForIdle()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to open simple browser`)
      }
    },
  }
}
