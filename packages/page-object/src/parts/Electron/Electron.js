export const create = ({ electronApp, VError }) => {
  return {
    async evaluate(expression) {
      return await electronApp.evaluate(expression)
    },
    async mockDialog(response) {
      try {
        const responseString = JSON.stringify(JSON.stringify(response))
        await this.evaluate(`() => {
  const electron = globalThis._VSCODE_NODE_MODULES["electron"];
  electron.dialog.showMessageBox = () => {
    return JSON.parse(${responseString})
  }
}()`)
      } catch (error) {
        throw new VError(error, `Failed to mock electron dialog`)
      }
    },
  }
}
