import * as CreateParams from '../CreateParams/CreateParams.ts'
import * as Terminal from '../Terminal/Terminal.ts'

const isDevtoolsCannotFindContextError = (error) => {
  return (
    error.name === 'DevtoolsProtocolError' &&
    (error.message === 'Cannot find context with specified id' || error.message === 'uniqueContextId not found')
  )
}

export const create = ({ electronApp, expect, ideVersion, page, platform, VError }: CreateParams.CreateParams) => {
  return {
    async waitForApplicationToBeReady({
      enableExtensions,
      inspectPtyHost,
    }: {
      inspectPtyHost: boolean
      enableExtensions: boolean
    }): Promise<void> {
      try {
        const main = page.locator('[role="main"]')
        await expect(main).toBeVisible({
          timeout: 30_000,
        })
      } catch (error) {
        if (isDevtoolsCannotFindContextError(error)) {
          // ignore and try again
          const main = page.locator('[role="main"]')
          await expect(main).toBeVisible({
            timeout: 30_000,
          })
          return page
        } else {
          throw error
        }
      }
      if (!enableExtensions) {
        const notification = page.locator('text=All installed extensions are temporarily disabled.')
        await expect(notification).toBeVisible({
          timeout: 15_000,
        })
      }
      if (inspectPtyHost) {
        const terminal = Terminal.create({
          electronApp,
          expect,
          ideVersion,
          page,
          platform,
          VError,
        })
        await terminal.show()
        await terminal.killAll()
      }
    },
  }
}
