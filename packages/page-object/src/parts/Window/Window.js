// TODO avoid using timeout
const SHORT_TIMEOUT = 250

export const create = ({ page, VError, expect }) => {
  return {
    async focus() {
      try {
      } catch (error) {
        throw new VError(error, `Failed to focus window`)
      }
    },
    async blur() {
      try {
      } catch (error) {
        throw new VError(error, `Failed to focus window`)
      }
    },
  }
}
