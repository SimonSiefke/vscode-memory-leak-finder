import * as Assert from '../Assert/Assert.ts'
import * as PageObjectState from '../PageObjectState/PageObjectState.ts'
import type { IdleResult } from '../PageWaitForIdle/PageWaitForIdle.ts'

const MaxAttempts = 3

export class MeasurementInconclusiveError extends Error {
  readonly attempts: number

  constructor(attempts: number) {
    super(`Measurement is inconclusive after ${attempts} idle callback timeouts`)
    this.name = 'MeasurementInconclusiveError'
    this.attempts = attempts
  }
}

export const waitForQuiescence = async (connectionId: number): Promise<IdleResult> => {
  Assert.number(connectionId)
  const pageObject = PageObjectState.getPageObjectContext(connectionId)
  for (let attempt = 1; attempt <= MaxAttempts; attempt++) {
    const result = await pageObject.page.waitForIdle()
    if (!result.didTimeout) {
      return result
    }
  }
  throw new MeasurementInconclusiveError(MaxAttempts)
}
