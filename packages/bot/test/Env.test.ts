import { expect, test } from '@jest/globals'
import { getEnv } from '../src/parts/Env/Env.ts'

test('getEnv returns defaults when optional values are omitted', () => {
  const result = getEnv({})

  expect(result).toEqual({
    allowedLogins: ['SimonSiefke'],
    workflowFileName: 'measure-on-demand.yml',
    workflowOwner: 'SimonSiefke',
    workflowRef: 'main',
    workflowRepo: 'vscode-memory-leak-finder',
  })
})

test('getEnv parses comma separated allowed logins and workflow overrides', () => {
  const result = getEnv({
    BOT_ALLOWED_LOGINS: 'SimonSiefke,octocat',
    BOT_WORKFLOW_FILE_NAME: 'custom-workflow.yml',
    BOT_WORKFLOW_OWNER: 'microsoft',
    BOT_WORKFLOW_REF: 'feature/bot',
    BOT_WORKFLOW_REPO: 'vscode',
  })

  expect(result).toEqual({
    allowedLogins: ['SimonSiefke', 'octocat'],
    workflowFileName: 'custom-workflow.yml',
    workflowOwner: 'microsoft',
    workflowRef: 'feature/bot',
    workflowRepo: 'vscode',
  })
})
