export type BotEnv = {
  readonly allowedLogins: readonly string[]
  readonly workflowFileName: string
  readonly workflowOwner: string
  readonly workflowRef: string
  readonly workflowRepo: string
}

const parseAllowedLogins = (value: string | undefined): readonly string[] => {
  if (!value) {
    return ['SimonSiefke']
  }
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export const getEnv = (env: NodeJS.ProcessEnv): BotEnv => {
  return {
    allowedLogins: parseAllowedLogins(env.BOT_ALLOWED_LOGINS),
    workflowFileName: env.BOT_WORKFLOW_FILE_NAME || 'measure-on-demand.yml',
    workflowOwner: env.BOT_WORKFLOW_OWNER || 'SimonSiefke',
    workflowRef: env.BOT_WORKFLOW_REF || 'main',
    workflowRepo: env.BOT_WORKFLOW_REPO || 'vscode-memory-leak-finder',
  }
}
