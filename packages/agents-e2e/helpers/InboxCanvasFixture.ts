import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'

type Message = {
  method?: string
  params?: { channel?: string; action?: { type?: string; data?: string; canvases?: { resource: string }[] } }
  _ahpLog?: { dir: string; connectionId: string; transport: string; droppedEntries?: number; truncated?: boolean }
}

export const waitFor = async <T>(description: string, read: () => Promise<T>, accept: (value: T) => boolean): Promise<T> => {
  const deadline = Date.now() + 15_000
  let value: T
  do {
    value = await read()
    if (accept(value)) return value
    await new Promise((resolve) => setTimeout(resolve, 100))
  } while (Date.now() < deadline)
  throw new Error(`Timed out waiting for ${description}: ${JSON.stringify(value)}`)
}

export const readMessages = async (directory: string): Promise<Message[]> => {
  const files = (await readdir(directory)).filter((name) => name.endsWith('.jsonl')).sort()
  const messages: Message[] = []
  for (const file of files) {
    const text = await readFile(join(directory, file), 'utf8')
    // The writer may currently be appending the final line. Never parse a partial entry.
    for (const line of text
      .slice(0, text.lastIndexOf('\n') + 1)
      .split('\n')
      .filter(Boolean)) {
      const message: Message = JSON.parse(line)
      if (message._ahpLog?.truncated || message._ahpLog?.droppedEntries)
        throw new Error('Incomplete AHP capture cannot validate subscriptions')
      messages.push(message)
    }
  }
  return messages
}

export const subscriptions = (messages: Message[]): Set<string> => {
  const live = new Map<string, string>()
  for (const message of messages) {
    const meta = message._ahpLog
    if (meta?.dir !== 'c2s' || meta.transport !== 'local' || !message.params?.channel) continue
    const channel = message.params.channel
    const key = `${meta.connectionId}:${channel}`
    if (message.method === 'subscribe') live.set(key, channel)
    else if (message.method === 'unsubscribe') live.delete(key)
  }
  return new Set(live.values())
}

export const canvasResources = (messages: Message[]): string[] => [
  ...new Set(
    messages.flatMap((message) =>
      message._ahpLog?.dir === 's2c' && message._ahpLog.transport === 'local' && message.params?.action?.type === 'chat/canvasesChanged'
        ? (message.params.action.canvases ?? []).map((canvas) => canvas.resource)
        : [],
    ),
  ),
]

export const connect = async (fixtureDirectory: string, userData: string) => {
  const logRoot = join(userData, 'logs')
  const logs = (await readdir(logRoot)).sort()
  const logDirectory = join(logRoot, logs.at(-1)!, 'ahp')
  await waitFor(
    'AHP log readiness',
    () => readMessages(logDirectory),
    (messages) => messages.length > 0,
  )

  return {
    async openNewCanvas(prompt: string) {
      const before = new Set(canvasResources(await readMessages(logDirectory)))
      const ready = join(fixtureDirectory, 'ready')
      const opened = await waitFor(
        'the SDK fixture matching the requested conversation',
        async () => {
          for (const file of await readdir(ready).catch(() => [] as string[])) {
            const fixture: { port: number; sessionId: string } = JSON.parse(await readFile(join(ready, file), 'utf8'))
            let response: Response
            try {
              response = await fetch(`http://127.0.0.1:${fixture.port}/open?prompt=${encodeURIComponent(prompt)}`, {
                method: 'POST',
                signal: AbortSignal.timeout(10_000),
              })
            } catch (error) {
              // An inactive SDK session can stop its extension before cleanup
              // removes the readiness file. It cannot match this conversation.
              if ((error as { cause?: { code?: string } }).cause?.code === 'ECONNREFUSED') continue
              throw error
            }
            if (response.status === 409) continue
            if (!response.ok) throw new Error(`Canvas fixture failed: ${await response.text()}`)
            return (await response.json()) as { instanceId?: string; url?: string }
          }
          return undefined
        },
        (value) => value !== undefined,
      )
      if (opened?.instanceId !== 'inbox-contract-instance') throw new Error('SDK did not open the requested canvas')
      const resources = await waitFor(
        'a published AHP canvas',
        async () => canvasResources(await readMessages(logDirectory)).filter((resource) => !before.has(resource)),
        (values) => values.length > 0,
      )
      if (resources.length !== 1) throw new Error(`Expected one fixture canvas, got ${resources.length}`)
      if (!opened.url || !/^http:\/\/127\.0\.0\.1:\d+$/.test(opened.url)) throw new Error('Expected the local canvas URL')
      return { resource: resources[0], url: opened.url }
    },
    async expectSubscribed(resource: string, subscribed: boolean, activePeer?: string) {
      await waitFor(
        `${resource} subscription=${subscribed}`,
        async () => {
          const messages = await readMessages(logDirectory)
          if (
            activePeer &&
            messages.some(
              (message) =>
                message._ahpLog?.dir === 'c2s' &&
                message._ahpLog.transport === 'local' &&
                message.method === 'unsubscribe' &&
                message.params?.channel === activePeer,
            )
          ) {
            throw new Error(`Intentionally active canvas was unsubscribed: ${activePeer}`)
          }
          const live = subscriptions(messages)
          return { target: live.has(resource), peer: activePeer ? live.has(activePeer) : true }
        },
        (state) => state.target === subscribed && state.peer,
      )
    },
  }
}
