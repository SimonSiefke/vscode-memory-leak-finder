export const create = ({ expect, page, VError }) => {
  return {
    async addMarkdownCell() {
      try {
      } catch (error) {
        throw new VError(error, `Failed to add markdown cell`)
      }
    },
    async removeMarkdownCell() {
      try {
      } catch (error) {
        throw new VError(error, `Failed to remove markdown cell`)
      }
    },
    async scrollDown() {
      try {
      } catch (error) {
        throw new VError(error, `Failed to scroll down in notebook`)
      }
    },
    async scrollUp() {
      try {
      } catch (error) {
        throw new VError(error, `Failed to scroll up in notebook`)
      }
    },
  }
}
