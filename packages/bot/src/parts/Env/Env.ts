export type BotEnv = {
  readonly allowedLogins: readonly string[]
  readonly publicBaseUrl: string
  readonly userDataStoragePath: string
  readonly userDataUploadToken: string
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
    publicBaseUrl: env.BOT_PUBLIC_BASE_URL || env.WEBHOOK_PROXY_URL || '',
    userDataStoragePath: env.BOT_USER_DATA_STORAGE_PATH || '.bot-user-data',
    userDataUploadToken: env.BOT_USER_DATA_UPLOAD_TOKEN || '',
    workflowFileName: env.BOT_WORKFLOW_FILE_NAME || 'measure-on-demand.yml',
    workflowOwner: env.BOT_WORKFLOW_OWNER || 'SimonSiefke',
    workflowRef: env.BOT_WORKFLOW_REF || 'main',
    workflowRepo: env.BOT_WORKFLOW_REPO || 'vscode-memory-leak-finder',
  }
}
