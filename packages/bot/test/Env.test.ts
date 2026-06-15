import { expect, test } from '@jest/globals'
import { getEnv } from '../src/parts/Env/Env.ts'

test('getEnv returns defaults when optional values are omitted', () => {
  const result = getEnv({})

  expect(result).toEqual({
    allowedLogins: ['SimonSiefke'],
    publicBaseUrl: '',
    userDataR2AccessKeyId: '',
    userDataR2AccountId: '',
    userDataR2Bucket: '',
    allMockDataR2ObjectKey: 'all-mock-data.zip',
    userDataR2ObjectKey: '.vscode-user-data-dir.zip',
    userDataR2SecretAccessKey: '',
    userDataSnapshotToken: '',
    userDataSnapshotUrl: '',
    userDataStoragePath: '.bot-user-data',
    userDataUploadToken: '',
    workflowFileName: 'measure-on-demand.yml',
    workflowOwner: 'SimonSiefke',
    workflowRef: 'main',
    workflowRepo: 'vscode-memory-leak-finder',
  })
})

test('getEnv falls back to WEBHOOK_PROXY_URL for the public base url', () => {
  const result = getEnv({
    WEBHOOK_PROXY_URL: 'https://bot.example.com',
  })

  expect(result.publicBaseUrl).toBe('https://bot.example.com')
})

test('getEnv parses comma separated allowed logins and workflow overrides', () => {
  const result = getEnv({
    BOT_ALLOWED_LOGINS: 'SimonSiefke,octocat',
    BOT_PUBLIC_BASE_URL: 'https://bot.example.com',
    BOT_USER_DATA_R2_ACCESS_KEY_ID: 'access-key-id',
    BOT_USER_DATA_R2_ACCOUNT_ID: 'cloudflare-account-id',
    BOT_USER_DATA_R2_BUCKET: 'vscode-memory-leak-finder',
    BOT_ALL_MOCK_DATA_R2_OBJECT_KEY: 'all-mock-data.zip',
    BOT_USER_DATA_R2_OBJECT_KEY: '.vscode-user-data-dir.zip',
    BOT_USER_DATA_R2_SECRET_ACCESS_KEY: 'secret-access-key',
    BOT_USER_DATA_SNAPSHOT_TOKEN: 'download-token',
    BOT_USER_DATA_SNAPSHOT_URL: 'https://pub-12345.r2.dev/active-user-data-snapshot.zip',
    BOT_USER_DATA_STORAGE_PATH: '/tmp/bot-user-data',
    BOT_USER_DATA_UPLOAD_TOKEN: 'shared-upload-token',
    BOT_WORKFLOW_FILE_NAME: 'custom-workflow.yml',
    BOT_WORKFLOW_OWNER: 'microsoft',
    BOT_WORKFLOW_REF: 'feature/bot',
    BOT_WORKFLOW_REPO: 'vscode',
  })

  expect(result).toEqual({
    allowedLogins: ['SimonSiefke', 'octocat'],
    publicBaseUrl: 'https://bot.example.com',
    userDataR2AccessKeyId: 'access-key-id',
    userDataR2AccountId: 'cloudflare-account-id',
    userDataR2Bucket: 'vscode-memory-leak-finder',
    allMockDataR2ObjectKey: 'all-mock-data.zip',
    userDataR2ObjectKey: '.vscode-user-data-dir.zip',
    userDataR2SecretAccessKey: 'secret-access-key',
    userDataSnapshotToken: 'download-token',
    userDataSnapshotUrl: 'https://pub-12345.r2.dev/active-user-data-snapshot.zip',
    userDataStoragePath: '/tmp/bot-user-data',
    userDataUploadToken: 'shared-upload-token',
    workflowFileName: 'custom-workflow.yml',
    workflowOwner: 'microsoft',
    workflowRef: 'feature/bot',
    workflowRepo: 'vscode',
  })
})

test('getEnv prefers BOT_PUBLIC_BASE_URL over WEBHOOK_PROXY_URL', () => {
  const result = getEnv({
    BOT_PUBLIC_BASE_URL: 'https://public.example.com',
    WEBHOOK_PROXY_URL: 'https://tunnel.example.com',
  })

  expect(result.publicBaseUrl).toBe('https://public.example.com')
})
