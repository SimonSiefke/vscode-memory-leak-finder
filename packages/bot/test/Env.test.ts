import { expect, test } from '@jest/globals'
import { getEnv } from '../src/parts/Env/Env.ts'

test('getEnv returns defaults when optional values are omitted', () => {
  const result = getEnv({})

  expect(result).toEqual({
    allowedLogins: ['SimonSiefke'],
    publicBaseUrl: '',
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
