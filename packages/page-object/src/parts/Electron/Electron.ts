import * as CreateParams from '../CreateParams/CreateParams.ts'

export const create = ({ electronApp, VError }: CreateParams.CreateParams) => {
  return {
    async evaluate(expression) {
      return await electronApp.evaluate(expression)
    },
    async mockDialog(response) {
      try {
        const responseString = JSON.stringify(JSON.stringify(response))
        await this.mockElectron('dialog', 'showMessageBox', ` () => { return JSON.parse(${responseString}) }`)
        const that = this
        return {
          async [Symbol.asyncDispose]() {
            await that.unmockElectron('dialog', 'showMessageBox')
          },
        }
      } catch (error) {
        throw new VError(error, `Failed to mock electron dialog`)
      }
    },
    async mockElectron(namespace: string, key: string, implementationCode: string) {
      await this.evaluate(`(() => {
  const electron = globalThis._____electron
  globalThis['____electron_original_${namespace}'] = electron['${namespace}']['${key}']
  electron['${namespace}']['${key}'] = ${implementationCode}
})()`)
    },
    async mockOpenDialog(response) {
      try {
        const responseString = JSON.stringify(JSON.stringify(response))
        await this.mockElectron('dialog', 'showOpenDialog', `() => { return JSON.parse(${responseString}) }`)
      } catch (error) {
        throw new VError(error, `Failed to mock electron open dialog`)
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
    async unmockElectron(namespace: string, key: string) {
      await this.evaluate(`(() => {
  const electron = globalThis._____electron
  const original = globalThis['____electron_original_${namespace}']
  if(!original){
    throw new Error("original function not found")
  }
  electron['${namespace}']['${key}'] = original
})()`)
    },
  }
}
