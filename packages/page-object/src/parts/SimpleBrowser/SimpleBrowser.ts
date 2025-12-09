import { createServer } from 'node:http'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export const create = ({ page, expect, VError, ideVersion }) => {
  return {
    async show({ port }) {
      try {
        const server = createServer((req, res) => {
          res.statusCode = 200
          res.end('<h1>hello world</h1>')
        })
        const { resolve, promise } = Promise.withResolvers()
        server.once('listening', resolve)
        server.listen(port)
        await promise

        const quickPick = QuickPick.create({ page, expect, VError })
        await quickPick.executeCommand(WellKnownCommands.SimpleBrowserShow, {
          pressKeyOnce: true,
          stayVisible: true,
        })
        await page.waitForIdle()
        const message = page.locator('#quickInput_message')
        await expect(message).toBeVisible()
        await expect(message).toHaveText(`Enter url to visit (Press 'Enter' to confirm or 'Escape' to cancel)`)
        await quickPick.type(`http://localhost:${port}`)
        console.log('waiten')
        await new Promise((r) => {})
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
