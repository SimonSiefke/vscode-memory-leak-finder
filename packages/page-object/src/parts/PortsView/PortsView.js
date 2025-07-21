export const create = ({ expect, page, VError }) => {
  return {
    async open() {
      try {
        // TODO
      } catch (error) {
        throw new VError(error, `Failed to open ports view`)
      }
    },
    async close() {
      try {
        // TODO close panel
      } catch (error) {
        throw new VError(error, `Failed to close ports view`)
      }
    },
  }
}
