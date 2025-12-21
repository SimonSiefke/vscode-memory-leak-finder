import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ Panel }: TestContext): Promise<void> => {
  await Panel.hide()
}

export const run = async ({ Panel }: TestContext): Promise<void> => {
  await Panel.show()
  await Panel.hide()
}
