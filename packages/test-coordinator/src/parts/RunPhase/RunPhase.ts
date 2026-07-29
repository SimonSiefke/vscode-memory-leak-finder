export type TestPhase = 'dispose' | 'measure' | 'prepare' | 'setup' | 'teardown' | 'warmup'

export interface PhaseTimeout {
  readonly iteration: number
  readonly phase: TestPhase
  readonly test: string
  readonly timeout: number
}

export class PhaseTimeoutError extends Error {
  readonly duration: number
  readonly iteration: number
  readonly phase: TestPhase
  readonly test: string

  constructor({ duration, iteration, phase, test }: Omit<PhaseTimeout, 'timeout'> & { readonly duration: number }) {
    super(`${phase} timed out after ${duration}ms (test=${test}, iteration=${iteration})`)
    this.name = 'PhaseTimeoutError'
    this.duration = duration
    this.iteration = iteration
    this.phase = phase
    this.test = test
  }
}

export const runPhase = async <T>({ iteration, phase, test, timeout }: PhaseTimeout, operation: () => Promise<T>): Promise<T> => {
  const start = Date.now()
  console.log(`test phase: test=${test} phase=${phase} iteration=${iteration} timeout=${timeout}ms`)
  let timeoutId
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = globalThis.setTimeout(() => {
      reject(
        new PhaseTimeoutError({
          duration: Date.now() - start,
          iteration,
          phase,
          test,
        }),
      )
    }, timeout)
  })
  try {
    return await Promise.race([Promise.resolve().then(operation), timeoutPromise])
  } finally {
    globalThis.clearTimeout(timeoutId)
  }
}
