import { createServer } from 'node:http'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export const create = ({ page, expect, VError, ideVersion }) => {
  return {
    async show(url) {
      try {
        const server = createServer((req, res) => {
          res.statusCode = 200
          res.end('<h1>hello world</h1>')
        })
        const { resolve, promise } = Promise.withResolvers()
        server.once('listening', resolve)
        await promise

        const quickPick = QuickPick.create({ page, expect, VError })
        await quickPick.executeCommand(WellKnownCommands.SimpleBrowserShow)
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
