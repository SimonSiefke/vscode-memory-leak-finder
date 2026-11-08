export interface TestMetadata {
  skip?: unknown
  skipInCi?: unknown
  requiresCopilotAuth?: unknown
  requiresNetwork?: unknown
}

export interface EligibilityOptions {
  isGithubActions: boolean
  forceRun?: boolean
  allowCopilotAuthInCi?: boolean
  runNetworkTestsAnyway?: boolean
}

// Keep discovery and execution on the same policy, including the historical
// filename-based Copilot requirement.
export const testExclusionReason = (module: TestMetadata, file: string, options: EligibilityOptions): string | null => {
  if (module.skipInCi && options.isGithubActions) return 'skipInCi'
  const chat = /[/\\](?:chat-|terminal-inline-chat-)/.test(file)
  if ((module.requiresCopilotAuth || chat) && options.isGithubActions && !options.allowCopilotAuthInCi) return 'requiresCopilotAuth'
  if (module.requiresNetwork && options.isGithubActions && !options.runNetworkTestsAnyway) return 'requiresNetwork'
  if (module.skip && !options.forceRun) return 'skip'
  return null
}
