export const create = ({ expect, page, VError }) => {
  return {
    async show() {
      try {
      } catch (error) {
        throw new VError(error, `Failed to show debug console`)
      }
    },
    async hide() {
      try {
      } catch (error) {
        throw new VError(error, `Failed to hide debug console`)
      }
    },
  }
}
