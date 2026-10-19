import { afterEach, expect, test } from '@jest/globals'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as AgentWindowMock from '../src/parts/AgentWindowMock/AgentWindowMock.ts'

let directory = ''
let mock: Awaited<ReturnType<typeof AgentWindowMock.start>> | undefined

afterEach(async () => {
  await mock?.dispose()
  mock = undefined
  if (directory) await rm(directory, { recursive: true, force: true })
})

const start = async () => {
  directory = await mkdtemp(join(tmpdir(), 'agents-window-mock-'))
  mock = await AgentWindowMock.start(directory)
  return mock
}

test('advertises the model used by the real agent host', async () => {
  const { env } = await start()
  const response = await fetch(`${env.COPILOT_API_URL}/models`)
  expect(response.status).toBe(200)
  const { data } = (await response.json()) as { data: unknown[] }
  expect(data).toHaveLength(1)
  expect(data[0]).toMatchObject({ id: AgentWindowMock.modelId, supported_endpoints: ['/responses'] })
})

test('streams a complete assistant response and closes the stream', async () => {
  const { env } = await start()
  const response = await fetch(`${env.COPILOT_API_URL}/responses`, {
    method: 'POST',
    body: JSON.stringify({ model: AgentWindowMock.modelId, input: [{ role: 'user', content: 'Hello' }] }),
  })
  expect(response.headers.get('content-type')).toBe('text/event-stream')
  const events = (await response.text())
    .trim()
    .split('\n\n')
    .map((line) => JSON.parse(line.slice('data: '.length)))
  expect(events.map((event) => event.type)).toEqual([
    'response.created',
    'response.output_item.added',
    'response.content_part.added',
    'response.output_text.delta',
    'response.output_text.done',
    'response.content_part.done',
    'response.output_item.done',
    'response.completed',
  ])
  expect(events.at(-1).response).toMatchObject({
    status: 'completed',
    output: [{ role: 'assistant', content: [{ type: 'output_text', text: AgentWindowMock.reply }] }],
  })
})

test('rejects unknown routes and invalid JSON without calling a live backend', async () => {
  const { env } = await start()
  expect((await fetch(`${env.COPILOT_API_URL}/unknown`)).status).toBe(404)
  expect((await fetch(`${env.COPILOT_API_URL}/responses`, { method: 'POST', body: '{' })).status).toBe(400)
})

test('configures the Agents profile and isolates SDK state with fake credentials', async () => {
  const { env } = await start()
  for (const relativePath of ['User/settings.json', 'User/profiles/builtin/agents/settings.json']) {
    const settings = JSON.parse(await readFile(join(directory, relativePath), 'utf8'))
    expect(settings['chat.agentHost.unsafeTestToken']).toBe(env.GITHUB_COPILOT_API_TOKEN)
    expect(settings['sessions.useWorktree']).toBe(false)
    expect(settings['chat.defaultModel']).toBe(AgentWindowMock.modelId)
  }
  expect(env.COPILOT_HOME).toBe(join(directory, 'agents-test-state', '.copilot'))
  expect(env.CODEX_HOME).toBe(join(directory, 'agents-test-state', '.codex'))
  expect(env.VSCODE_AGENT_HOST_CAPI_URL_OVERRIDE).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/)
})

test('restores existing settings and removes mock-only profile settings on disposal', async () => {
  directory = await mkdtemp(join(tmpdir(), 'agents-window-mock-'))
  await mkdir(join(directory, 'User'), { recursive: true })
  const settingsPath = join(directory, 'User/settings.json')
  const original = '{ "editor.fontSize": 17 }\n'
  await writeFile(settingsPath, original)
  mock = await AgentWindowMock.start(directory)
  const address = mock.env.COPILOT_API_URL
  expect(JSON.parse(await readFile(settingsPath, 'utf8'))['editor.fontSize']).toBe(17)
  await mock.dispose()
  await mock.dispose()
  expect(await readFile(settingsPath, 'utf8')).toBe(original)
  await expect(readFile(join(directory, 'User/profiles/builtin/agents/settings.json'))).rejects.toMatchObject({ code: 'ENOENT' })
  await expect(fetch(`${address}/models`)).rejects.toThrow()
})
