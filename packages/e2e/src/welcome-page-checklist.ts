import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Editor, WelcomePage }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await WelcomePage.show()
  await WelcomePage.showFundamentals()
}

export const run = async ({ WelcomePage }: TestContext): Promise<void> => {
  const stepCount = await WelcomePage.getFundamentalsStepCount()

  for (let index = 0; index < stepCount; index += 1) {
    await WelcomePage.expandStepByIndex(index)
    await WelcomePage.checkStepByIndex(index)
  }

  for (let index = 0; index < stepCount; index += 1) {
    await WelcomePage.uncheckStepByIndex(index)
  }

  await WelcomePage.expandStepByIndex(0)
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
