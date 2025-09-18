import type { TestContext } from '../types.js'

export const setup = async ({  Panel  }: TestContext): Promise<void> => {
  await Panel.hide()
}

export const run = async ({  Problems  }: TestContext): Promise<void> => {
  await Problems.show()
  await Problems.hide()
}
