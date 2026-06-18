import { setTimeout as delay } from 'node:timers/promises'
import type { CreateParams } from '../CreateParams/CreateParams.ts'

export const create = ({ page, VError }: CreateParams) => {
  return {
    async waitMinutes(minutes: number): Promise<void> {
      try {
        await page.waitForIdle()
        await delay(minutes * 60 * 1000)
      } catch (error) {
        throw new VError(error, `Failed to wait ${minutes} minute(s)`)
      }
    },
  }
}
