import * as Assert from '../Assert/Assert.ts'
import * as ImportTest from '../ImportTest/ImportTest.ts'
import * as TestStage from '../TestStage/TestStage.ts'

const hasChatTestFileName = (file: string): boolean => {
  return (
    file.includes('/chat-') ||
    file.includes('\\chat-') ||
    file.includes('/terminal-inline-chat-') ||
    file.includes('\\terminal-inline-chat-')
  )
}

// @ts-ignore
export const setupTestWithCallback = async (pageObject, file, forceRun, isGithubActions, allowCopilotAuthInCi, runNetworkTestsAnyway) => {
  Assert.object(pageObject)
  Assert.string(file)
  Assert.boolean(forceRun)
  Assert.boolean(isGithubActions)
  Assert.boolean(runNetworkTestsAnyway)
  // Assert.boolean(allowCopilotAuthInCi)
  const module = await ImportTest.importTest(file)
  const wasOriginallySkipped = Boolean(module.skip)
  const isCi = isGithubActions
  const requiresCopilotAuth = Boolean(module.requiresCopilotAuth) || hasChatTestFileName(file)
  if (requiresCopilotAuth && isCi && !allowCopilotAuthInCi) {
    return { error: null, skipped: true, wasOriginallySkipped }
  }
  if (module.requiresNetwork && isCi && !runNetworkTestsAnyway) {
    return { error: null, skipped: true, wasOriginallySkipped }
  }
  if (module.skip && !forceRun) {
    return { error: null, skipped: true, wasOriginallySkipped }
  }
  try {
    await TestStage.beforeSetup(module, pageObject)
    await TestStage.setup(module, pageObject)
    return { error: null, skipped: false, wasOriginallySkipped }
  } catch (error) {
    // If setup fails, return the error information instead of throwing
    return { error: error, skipped: false, wasOriginallySkipped }
  }
}
