import * as Terminal from '../Terminal/Terminal.ts'

const isDevtoolsCannotFindContextError = (error) => {
  return (
    error.name === 'DevtoolsProtocolError' &&
    (error.message === 'Cannot find context with specified id' || error.message === 'uniqueContextId not found')
  )
}

export const create = ({ page, expect, VError, ideVersion }) => {
  return {
    async waitForApplicationToBeReady({ inspectPtyHost }: { inspectPtyHost: boolean }): Promise<void> {
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
      const notification = page.locator('text=All installed extensions are temporarily disabled.')
      await expect(notification).toBeVisible({
        timeout: 15_000,
      })
      if (inspectPtyHost) {
        const terminal = Terminal.create({
          page,
          expect,
          VError,
          ideVersion,
        })
        await terminal.show()
        await terminal.killAll()
      }
    },
  }
}
