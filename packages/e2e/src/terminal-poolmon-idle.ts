import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ Terminal }: TestContext): Promise<void> => {
  await Terminal.killAll()
  await Terminal.show()
}

export const run = async (): Promise<void> => {
  // Approximate split/dispose pacing without creating additional terminals.
  await new Promise((resolve) => setTimeout(resolve, 1500))
}
