export const create = ({ expect, page, VError }) => {
  return {
    async select(completionText) {
      try {
        // TODO
      } catch (error) {
        throw new VError(error, `Failed to select completion ${completionText}`)
      }
    },
  }
}
