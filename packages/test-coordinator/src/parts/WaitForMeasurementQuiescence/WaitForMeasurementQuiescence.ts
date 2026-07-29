import * as TestWorkerWaitForQuiescence from '../TestWorkerWaitForQuiescence/TestWorkerWaitForQuiescence.ts'

export interface MeasurementIdleResult {
  readonly didTimeout: boolean
  readonly duration: number
  readonly iteration: number
  readonly phase: 'measure'
  readonly test: string
}

export class MeasurementInconclusiveError extends Error implements MeasurementIdleResult {
  readonly didTimeout = true
  readonly duration: number
  readonly iteration: number
  readonly phase = 'measure' as const
  readonly test: string

  constructor({ duration, iteration, test }: Omit<MeasurementIdleResult, 'didTimeout' | 'phase'>) {
    super(`Measurement is inconclusive (test=${test}, phase=measure, iteration=${iteration}, duration=${duration}ms)`)
    this.name = 'MeasurementInconclusiveError'
    this.duration = duration
    this.iteration = iteration
    this.test = test
  }
}

export const waitForMeasurementQuiescence = async ({
  connectionId,
  iteration,
  rpc,
  test,
}: {
  readonly connectionId: number
  readonly iteration: number
  readonly rpc: any
  readonly test: string
}): Promise<MeasurementIdleResult> => {
  const start = Date.now()
  try {
    const result = await TestWorkerWaitForQuiescence.testWorkerWaitForQuiescence(rpc, connectionId)
    return {
      didTimeout: result.didTimeout,
      duration: Date.now() - start,
      iteration,
      phase: 'measure',
      test,
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Measurement is inconclusive')) {
      throw new MeasurementInconclusiveError({
        duration: Date.now() - start,
        iteration,
        test,
      })
    }
    throw error
  }
}
