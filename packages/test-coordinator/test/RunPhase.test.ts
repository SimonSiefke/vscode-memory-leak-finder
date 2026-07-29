import { expect, jest, test } from '@jest/globals'
import { PhaseTimeoutError, runPhase } from '../src/parts/RunPhase/RunPhase.ts'

test('runPhase returns the operation result', async () => {
  await expect(
    runPhase(
      {
        iteration: 2,
        phase: 'measure',
        test: 'editor-auto-close-tag',
        timeout: 100,
      },
      async () => 42,
    ),
  ).resolves.toBe(42)
})

test.each(['dispose', 'prepare', 'setup', 'warmup', 'measure', 'teardown'] as const)(
  'runPhase bounds a hanging %s phase',
  async (phase) => {
    jest.useFakeTimers()
    const promise = runPhase(
      {
        iteration: 3,
        phase,
        test: 'test-name',
        timeout: 25,
      },
      async () => new Promise(() => {}),
    )
    const errorPromise = promise.catch((error) => error)

    await jest.advanceTimersByTimeAsync(25)
    const error = await errorPromise
    expect(error).toEqual(
      expect.objectContaining({
        duration: 25,
        iteration: 3,
        phase,
        test: 'test-name',
      }),
    )
    expect(error).toBeInstanceOf(PhaseTimeoutError)
    jest.useRealTimers()
  },
)
