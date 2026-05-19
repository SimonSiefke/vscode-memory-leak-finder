import { createHmac } from 'node:crypto'
import { mkdtemp, rm } from 'node:fs/promises'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, expect, test } from '@jest/globals'
import JSZip from 'jszip'
import nock from 'nock'
import { createNodeMiddleware, Probot } from 'probot'
import { createApp } from '../src/parts/App/App.ts'
import type { BotEnv } from '../src/parts/Env/Env.ts'
import { handleIssueComment } from '../src/parts/HandleIssueComment/HandleIssueComment.ts'
import { saveUserDataSnapshot } from '../src/parts/UserDataSnapshot/UserDataSnapshot.ts'

const webhookSecret = 'test-webhook-secret'

const testPrivateKey = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDHGGIrRn2ib5Fi
+cTw8XrmsQm2C6LBaZhxGQwPR44pxYkpsghp15rI9o325Chpf3RWRNT+yfKVSznB
U2KySyTsBygcK3woTa9/ZS8jVYP5BFZM00Ao0YfP4cBhJfJDJ0ufDq+WMUFB0+6q
gC23snJjxZ9izMY99HMpDs5EkhsF5YeDe6fL2uZhSBR2H3s7E823yAlGiySATr/n
WD0MCnfcFXZiC1Slc1ek+IeQEtThe/egFDcDcx9QNdEe3icqDpc5rY2UCJ4Fb9P2
pzGklpFpB0rjQKPuNf6KMovypIJMBkl+ilL5r73fVH0k7IJbqjpFBHWH2S7ikftM
qai7prSlAgMBAAECggEADWHZxrZg1KBX/vWHvmPrgqI/jfAMyHWAT154tXXgu/U2
Mb+wzz/J0ecOpkZyN/B0TFB+mkH5Of3khoEuwbS0KTWW8C51FIwaNyorh7NkYO0g
yYkBMkKD34jOop5cwRTyVoveaK5BXbsbevQ4KSAyY6XsKhrWWrePCQwLeHJIpOCe
X5TXDJCWDzzxFNyUpCKAsijLdascDN/G30jWEyL1tJ79dZ5hTsrx7SpNSK5W/I7q
PoOXLZVRRRamN/J69vEHbpL4ZGs+AtH4ackkFMF3NpGF74RS7/vs2hbgcOxCV/WZ
mfy6VicCXxizVbviTBtZGXk7/60nOwOom8o+OOlzKQKBgQDyV6uU7ZwXw0c7SUwT
eLuRk+aZmiXzxgV0qxn2wcp6MUe+QDmewtJjBv7NGm8xuJOrakhxhusPPklWR20U
xrQlpt8UNwTbr/bfcsQwdzhxustRrg7qVuRrxOyN4/DuvzaQCQ6BVR9VlmO5kwUh
WJ2Is9H9Oyax6eGJ9s6UrwmUXQKBgQDSUMaeHc9iZMeXdrMS8piADp7w91g7ivUE
pEzNPlvRT7KNAnEVpy6d3+D5djBfJbeB41THt/a1Bjkid76LN8g9Q6Z9AH98B+Zw
drh6LFLgIpNoIcEbMPocTs2TuB5LF7G6mMYnKmCT3WKpu2n+pgTXS0GP3Y3CoG3d
fp9F0z6c6QKBgQDUD6txUsr4cETwuB7+GvPnW8i6OI1lV66GfQLnToTjkCP7cy/4
oPqA9SoaSDttAtsVcJeb4DfoytRZz37AY3BYUkF66voxUzVwKnlK/8hAnPg1rV4X
6ZlQRK3LK980y9XvDD3JJreYqVTympguqeCQMupZ8VzW6pYVqAb1TIXRcQKBgFJo
IhrsVUkZcfdQJESFV+m9UNvcHu9duDm0Yv98sp9mGfEUhtjUI/jqMw2sGLH/ZlL3
j02eMIWnxZVS1A9asRQIQODz4//mXI2uhwQf/+0gvx9rMm4EF8wluHlsCDqmMxaJ
LANGoIbvlOwqqhKEXJs7OpozVotvLv090wyaBAuZAoGBALc7FlRD5SRVX6QHQM63
Hdvt14R3LKp1kZZSwMwgjV4ZYeM2xQ3GucgXX7dRXs4knoNT9lQiwJXVHx6fjML7
U5Bzup2cNGITbAZyeJLpdkXjucRw/R/IkofKMEvY0kNvQslVcgnR3B+cGxYiFhIU
DU7udKvHnknka3m6mQQDtiB6
-----END PRIVATE KEY-----`

type TestServer = {
  readonly close: () => Promise<void>
  readonly url: string
}

const createTestServer = async (envOverrides: Partial<BotEnv> = {}): Promise<TestServer> => {
  const middleware = await createNodeMiddleware(
    createApp({
      allowedLogins: ['SimonSiefke'],
      publicBaseUrl: '',
      userDataStoragePath: '.bot-user-data',
      userDataUploadToken: 'shared-upload-token',
      workflowFileName: 'measure-on-demand.yml',
      workflowOwner: 'SimonSiefke',
      workflowRef: 'main',
      workflowRepo: 'vscode-memory-leak-finder',
      ...envOverrides,
    }),
    {
      probot: new Probot({
        appId: 1,
        privateKey: testPrivateKey,
        secret: webhookSecret,
      }),
    },
  )

  const server = createServer((request: IncomingMessage, response: ServerResponse) => {
    middleware(request, response, () => {
      response.writeHead(404)
      response.end()
    })
  })

  const listenPromise = Promise.withResolvers<void>()
  server.listen(0, '127.0.0.1', listenPromise.resolve)
  await listenPromise.promise

  const { port } = server.address() as AddressInfo

  return {
    close: async () => {
      const closePromise = Promise.withResolvers<void>()
      server.close((error) => {
        if (error) {
          closePromise.reject(error)
          return
        }
        closePromise.resolve()
      })
      await closePromise.promise
    },
    url: `http://127.0.0.1:${port}`,
  }
}

const signPayload = (payload: string): string => {
  return `sha256=${createHmac('sha256', webhookSecret).update(payload).digest('hex')}`
}

const sendWebhook = async (url: string, eventName: string, payload: object): Promise<Response> => {
  const body = JSON.stringify(payload)
  return fetch(`${url}/api/github/webhooks`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-github-delivery': 'test-delivery-id',
      'x-github-event': eventName,
      'x-hub-signature-256': signPayload(body),
    },
    body,
  })
}

const createIssueCommentPayload = (body: string) => {
  return {
    action: 'created',
    comment: {
      body,
      id: 456,
      user: {
        login: 'SimonSiefke',
      },
    },
    installation: {
      id: 1,
    },
    issue: {
      number: 2846,
      pull_request: {
        url: 'https://api.github.com/repos/SimonSiefke/vscode-memory-leak-finder/pulls/2846',
      },
    },
    repository: {
      name: 'vscode-memory-leak-finder',
      owner: {
        login: 'SimonSiefke',
      },
    },
  }
}

const createIssueCommentPayloadWithAnonymousUser = (body: string) => {
  return {
    ...createIssueCommentPayload(body),
    comment: {
      ...createIssueCommentPayload(body).comment,
      user: null,
    },
  }
}

beforeEach(() => {
  nock.disableNetConnect()
  nock.enableNetConnect('127.0.0.1')
})

afterEach(() => {
  nock.cleanAll()
  nock.enableNetConnect()
})

test('app posts a syntax error comment for invalid run commands', async () => {
  const server = await createTestServer()
  let createdCommentBody = ''

  nock('https://api.github.com').persist().post('/app/installations/1/access_tokens').reply(201, {
    expires_at: '2099-01-01T00:00:00Z',
    permissions: {},
    repository_selection: 'selected',
    token: 'test-installation-token',
  })

  const githubApi = nock('https://api.github.com')
    .post('/repos/SimonSiefke/vscode-memory-leak-finder/issues/2846/comments', (requestBody) => {
      if (typeof requestBody === 'object' && requestBody && 'body' in requestBody && typeof requestBody.body === 'string') {
        createdCommentBody = requestBody.body
      }
      return true
    })
    .reply(201, {
      id: 9001,
    })

  try {
    const response = await sendWebhook(server.url, 'issue_comment', createIssueCommentPayload('@vscode-memory-leak-finder run --bad-flag'))

    expect(response.status).toBe(200)
    expect(createdCommentBody).toContain('Unable to start a measure run.')
    expect(createdCommentBody).toContain('Invalid command syntax.')
    expect(githubApi.isDone()).toBe(true)
  } finally {
    await server.close()
  }
})

test('app ignores issue comments without a user', async () => {
  const server = await createTestServer()

  nock('https://api.github.com').persist().post('/app/installations/1/access_tokens').reply(201, {
    expires_at: '2099-01-01T00:00:00Z',
    permissions: {},
    repository_selection: 'selected',
    token: 'test-installation-token',
  })

  try {
    const response = await sendWebhook(
      server.url,
      'issue_comment',
      createIssueCommentPayloadWithAnonymousUser('@vscode-memory-leak-finder run --measure named-function-count3'),
    )

    expect(response.status).toBe(200)
  } finally {
    await server.close()
  }
})

test('app dispatches a workflow for valid run commands', async () => {
  const storagePath = await mkdtemp(join(tmpdir(), 'bot-user-data-'))
  const zip = new JSZip()
  zip.file('User/settings.json', '{"chat.allowAnonymousAccess":true}')
  const zipContent = await zip.generateAsync({ type: 'nodebuffer' })
  const snapshot = await saveUserDataSnapshot(storagePath, zipContent, 'SimonSiefke')
  const server = await createTestServer({
    publicBaseUrl: 'https://bot.example.com',
    userDataStoragePath: storagePath,
  })
  let updatedCommentBody = ''
  let workflowDispatchInputs: Record<string, string> | undefined

  nock('https://api.github.com').persist().post('/app/installations/1/access_tokens').reply(201, {
    expires_at: '2099-01-01T00:00:00Z',
    permissions: {},
    repository_selection: 'selected',
    token: 'test-installation-token',
  })

  const githubApi = nock('https://api.github.com')
    .get('/repos/SimonSiefke/vscode-memory-leak-finder/pulls/2846')
    .reply(200, {
      base: {
        ref: 'main',
        sha: '0123456789abcdef0123456789abcdef01234567',
      },
      head: {
        ref: 'feature/bot',
        repo: {
          owner: {
            login: 'SimonSiefke',
          },
        },
      },
      html_url: 'https://github.com/SimonSiefke/vscode-memory-leak-finder/pull/2846',
    })
    .post('/repos/SimonSiefke/vscode-memory-leak-finder/issues/2846/comments')
    .reply(201, {
      id: 9002,
    })
    .patch('/repos/SimonSiefke/vscode-memory-leak-finder/issues/comments/9002', (requestBody) => {
      if (typeof requestBody === 'object' && requestBody && 'body' in requestBody && typeof requestBody.body === 'string') {
        updatedCommentBody = requestBody.body
      }
      return true
    })
    .reply(200, {})
    .post('/repos/SimonSiefke/vscode-memory-leak-finder/actions/workflows/measure-on-demand.yml/dispatches', (requestBody) => {
      if (typeof requestBody === 'object' && requestBody && 'inputs' in requestBody && typeof requestBody.inputs === 'object') {
        workflowDispatchInputs = requestBody.inputs as Record<string, string>
      }
      return true
    })
    .reply(204)

  try {
    const response = await sendWebhook(
      server.url,
      'issue_comment',
      createIssueCommentPayload(
        '@vscode-memory-leak-finder run --measure named-function-count3 --only chat-editor-fix --inspect-extensions',
      ),
    )

    expect(response.status).toBe(200)
    expect(updatedCommentBody).toContain('## Measure run started')
    expect(updatedCommentBody).toContain('0123456789abcdef0123456789abcdef01234567')
    expect(updatedCommentBody).toContain('SimonSiefke/feature/bot')
    expect(updatedCommentBody).not.toContain('https://github.com/SimonSiefke/vscode-memory-leak-finder/pull/2846')
    expect(workflowDispatchInputs).toEqual({
      base_commit: '0123456789abcdef0123456789abcdef01234567',
      candidate_ref: 'SimonSiefke/feature/bot',
      cli_args: '--measure named-function-count3 --only chat-editor-fix --inspect-extensions',
      download_user_data_zip_file_token: snapshot.downloadToken,
      download_user_data_zip_file_url: 'https://bot.example.com/api/user-data/download',
      measure: 'named-function-count3',
      only: 'chat-editor-fix',
      request_id: 'measure-run-2846-456',
      source_actor: 'SimonSiefke',
      source_comment_id: '456',
      source_issue_number: '2846',
      source_owner: 'SimonSiefke',
      source_pull_request_url: 'https://github.com/SimonSiefke/vscode-memory-leak-finder/pull/2846',
      source_repo: 'vscode-memory-leak-finder',
      status_comment_id: '9002',
      target_base_ref: 'main',
    })
    expect(githubApi.isDone()).toBe(true)
  } finally {
    await server.close()
    await rm(storagePath, { force: true, recursive: true })
  }
})

test('app posts a helpful error comment when no user data snapshot was uploaded yet', async () => {
  const storagePath = await mkdtemp(join(tmpdir(), 'bot-user-data-'))
  const env: BotEnv = {
    allowedLogins: ['SimonSiefke'],
    publicBaseUrl: 'https://bot.example.com',
    userDataStoragePath: storagePath,
    userDataUploadToken: 'shared-upload-token',
    workflowFileName: 'measure-on-demand.yml',
    workflowOwner: 'SimonSiefke',
    workflowRef: 'main',
    workflowRepo: 'vscode-memory-leak-finder',
  }
  const updatedCommentBodies: string[] = []
  const octokit = {
    rest: {
      actions: {
        createWorkflowDispatch: async () => {
          throw new Error('workflow dispatch should not be called when no snapshot is uploaded')
        },
      },
      issues: {
        createComment: async () => {
          return {
            data: {
              id: 9003,
            },
          }
        },
        updateComment: async (options: { owner: string; repo: string; comment_id: number; body: string }) => {
          updatedCommentBodies.push(options.body)
          return {}
        },
      },
      pulls: {
        get: async () => {
          return {
            data: {
              base: {
                ref: 'main',
                sha: '0123456789abcdef0123456789abcdef01234567',
              },
              head: {
                ref: 'feature/bot',
                repo: {
                  owner: {
                    login: 'SimonSiefke',
                  },
                },
              },
              html_url: 'https://github.com/SimonSiefke/vscode-memory-leak-finder/pull/2846',
            },
          }
        },
      },
    },
  }

  try {
    await handleIssueComment({
      env,
      octokit,
      payload: createIssueCommentPayload('@vscode-memory-leak-finder run --measure named-function-count3 --only chat-editor-fix'),
    })

    expect(updatedCommentBodies).toHaveLength(2)
    expect(updatedCommentBodies[1]).toContain('## Measure run failed to start')
    expect(updatedCommentBodies[1]).toContain('No uploaded vscode-user-data-dir snapshot is available yet.')
    expect(updatedCommentBodies[1]).toContain('/upload-user-data-dir')
  } finally {
    await rm(storagePath, { force: true, recursive: true })
  }
})
