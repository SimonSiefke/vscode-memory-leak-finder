import { expect, test } from '@jest/globals'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { canvasResources, readMessages, subscriptions } from '../helpers/InboxCanvasFixture.ts'

const message = (method: string, channel: string, connectionId = 'window') => ({
  method,
  params: { channel },
  _ahpLog: { dir: 'c2s', connectionId, transport: 'local' },
})

test('tracks local wire subscriptions per connection without counting duplicate subscribes', () => {
  const resource = 'ahp-canvas:/fixture'
  expect([...subscriptions([message('subscribe', resource), message('subscribe', resource), message('unsubscribe', resource)])]).toEqual([])
  expect([
    ...subscriptions([message('subscribe', resource), message('subscribe', resource, 'other-window'), message('unsubscribe', resource)]),
  ]).toEqual([resource])
  expect([
    ...subscriptions([
      { ...message('subscribe', resource), _ahpLog: { dir: 's2c', connectionId: 'window', transport: 'local' } },
      { ...message('subscribe', resource), _ahpLog: { dir: 'c2s', connectionId: 'remote', transport: 'websocket' } },
    ]),
  ]).toEqual([])
})

test('requires a server-published canvas rather than a client fixture claim', () => {
  const action = { channel: 'ahp-chat:/fixture', action: { type: 'chat/canvasesChanged', canvases: [{ resource: 'ahp-canvas:/fixture' }] } }
  expect(canvasResources([{ params: action, _ahpLog: { dir: 'c2s', connectionId: 'window', transport: 'local' } }])).toEqual([])
  expect(canvasResources([{ params: action, _ahpLog: { dir: 's2c', connectionId: 'window', transport: 'local' } }])).toEqual([
    'ahp-canvas:/fixture',
  ])
})

test('ignores an in-progress final write but rejects lost or truncated capture', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'inbox-wire-'))
  try {
    const path = join(directory, 'ahp.jsonl')
    const entry = message('subscribe', 'ahp-canvas:/fixture')
    await writeFile(path, `${JSON.stringify(entry)}\n{"unfinished":`)
    expect(await readMessages(directory)).toEqual([entry])
    for (const marker of [{ droppedEntries: 1 }, { truncated: true }]) {
      await writeFile(path, `${JSON.stringify({ _ahpLog: marker })}\n`)
      await expect(readMessages(directory)).rejects.toThrow('Incomplete AHP capture')
    }
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
