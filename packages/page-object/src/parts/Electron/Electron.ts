export const create = ({ electronApp, VError }) => {
  return {
    async evaluate(expression) {
      return await electronApp.evaluate(expression)
    },
    async mockElectron(namespace, key, implementationCode) {
      await this.evaluate(`(() => {
  const electron = globalThis._____electron
  electron['${namespace}']['${key}'] = ${implementationCode}
})()`)
    },
    async mockDialog(response) {
      try {
        const responseString = JSON.stringify(JSON.stringify(response))
        await this.mockElectron('dialog', 'showMessageBox', ` () => { return JSON.parse(${responseString}) }`)
      } catch (error) {
        throw new VError(error, `Failed to mock electron dialog`)
      }
    },
    async mockSaveDialog(response) {
      try {
        const responseString = JSON.stringify(JSON.stringify(response))
        await this.mockElectron('dialog', 'showSaveDialog', `() => { return JSON.parse(${responseString}) }`)
      } catch (error) {
        throw new VError(error, `Failed to mock electron save dialog`)
      }
    },
    async mockOpenDialog(response) {
      try {
        const responseString = JSON.stringify(JSON.stringify(response))
        await this.mockElectron('dialog', 'showOpenDialog', `() => { return JSON.parse(${responseString}) }`)
      } catch (error) {
        throw new VError(error, `Failed to mock electron open dialog`)
      }
    },
    async mockShellTrashItem() {
      try {
        await this.mockElectron(
          'shell',
          'trashItem',
          `(path) => {
  const require = globalThis._____require
  const fs = require('fs')
  fs.rmSync(path)
}`,
        )
      } catch (error) {
        throw new VError(error, `Failed to mock electron shell trash item`)
      }
    },
  }
}
