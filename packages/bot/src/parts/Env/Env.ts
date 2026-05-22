export type BotEnv = {
  readonly allowedLogins: readonly string[]
  readonly publicBaseUrl: string
  readonly userDataR2AccessKeyId: string
  readonly userDataR2AccountId: string
  readonly userDataR2Bucket: string
  readonly vscodeMockRequestsR2ObjectKey: string
  readonly vscodeProxyCertsR2ObjectKey: string
  readonly vscodeRequestsR2ObjectKey: string
  readonly userDataR2ObjectKey: string
  readonly userDataR2SecretAccessKey: string
  readonly userDataSnapshotToken: string
  readonly userDataSnapshotUrl: string
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
    userDataR2AccessKeyId: env.BOT_USER_DATA_R2_ACCESS_KEY_ID || '',
    userDataR2AccountId: env.BOT_USER_DATA_R2_ACCOUNT_ID || '',
    userDataR2Bucket: env.BOT_USER_DATA_R2_BUCKET || '',
    vscodeMockRequestsR2ObjectKey: env.BOT_VSCODE_MOCK_REQUESTS_R2_OBJECT_KEY || '.vscode-mock-requests.zip',
    vscodeProxyCertsR2ObjectKey: env.BOT_VSCODE_PROXY_CERTS_R2_OBJECT_KEY || '.vscode-proxy-certs.zip',
    vscodeRequestsR2ObjectKey: env.BOT_VSCODE_REQUESTS_R2_OBJECT_KEY || '.vscode-requests.zip',
    userDataR2ObjectKey: env.BOT_USER_DATA_R2_OBJECT_KEY || '.vscode-user-data-dir.zip',
    userDataR2SecretAccessKey: env.BOT_USER_DATA_R2_SECRET_ACCESS_KEY || '',
    userDataSnapshotToken: env.BOT_USER_DATA_SNAPSHOT_TOKEN || '',
    userDataSnapshotUrl: env.BOT_USER_DATA_SNAPSHOT_URL || '',
    userDataStoragePath: env.BOT_USER_DATA_STORAGE_PATH || '.bot-user-data',
    userDataUploadToken: env.BOT_USER_DATA_UPLOAD_TOKEN || '',
    workflowFileName: env.BOT_WORKFLOW_FILE_NAME || 'measure-on-demand.yml',
    workflowOwner: env.BOT_WORKFLOW_OWNER || 'SimonSiefke',
    workflowRef: env.BOT_WORKFLOW_REF || 'main',
    workflowRepo: env.BOT_WORKFLOW_REPO || 'vscode-memory-leak-finder',
  }
}
