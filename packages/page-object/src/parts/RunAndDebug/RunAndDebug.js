export const create = ({ expect, page, VError }) => {
  return {
    async startRunAndDebug() {
      try {
        // TODO
      } catch (error) {
        throw new VError(error, `Failed to start run and debug`)
      }
    },
    async pause() {
      try {
        // TODO
      } catch (error) {
        throw new VError(error, `Failed to pause`)
      }
    },
    async stop() {
      try {
        // TODO
      } catch (error) {
        throw new VError(error, `Failed to stop`)
      }
    },
  }
}
