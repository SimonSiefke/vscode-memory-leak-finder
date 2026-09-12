import type { TestContext } from '../types.ts'

export const skip = true

export const extraLaunchArgs = ['--enable-proposed-api=simon.speech-session-race-sample']

export const setup = async ({ QuickPick }: TestContext): Promise<void> => {
  await QuickPick.executeCommand('Speech Session Race: Setup')
}

export const run = async ({ QuickPick }: TestContext): Promise<void> => {
  await QuickPick.executeCommand('Speech Session Race: Churn')
}
