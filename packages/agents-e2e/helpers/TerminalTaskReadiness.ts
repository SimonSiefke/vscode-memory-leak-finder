import assert from 'node:assert/strict'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { readMessages, waitFor } from './InboxCanvasFixture.ts'

interface Message {
  params?: { channel?: string; action?: { type?: string; commandId?: string; commandLine?: string; exitCode?: number } }
  _ahpLog?: { dir: string; connectionId: string; transport: string }
}

export const taskExecutions = (messages: readonly Message[]) => {
  const executions = new Map<
    string,
    { key: string; channel: string; connectionId: string; commandLine: string; finished: boolean; exitCode?: number }
  >()
  for (const message of messages) {
    const meta = message._ahpLog
    const channel = message.params?.channel
    const action = message.params?.action
    if (meta?.dir !== 's2c' || meta.transport !== 'local' || !channel || !action?.commandId) continue
    const key = JSON.stringify([meta.connectionId, channel, action.commandId])
    if (action.type === 'terminal/commandExecuted' && action.commandLine?.includes('.chat-window-task-pids')) {
      executions.set(key, { key, channel, connectionId: meta.connectionId, commandLine: action.commandLine, finished: false })
    } else if (action.type === 'terminal/commandFinished') {
      const execution = executions.get(key)
      if (execution) {
        execution.finished = true
        execution.exitCode = action.exitCode
      }
    }
  }
  return [...executions.values()]
}

type Execution = ReturnType<typeof taskExecutions>[number]

export const connect = async (userData: string) => {
  const logRoot = join(userData, 'logs')
  const readLogMessages = async () => {
    const logs = (await readdir(logRoot)).sort()
    assert.ok(logs.length, 'The real agent-host transport must have a log directory')
    return (
      await Promise.all(
        logs.map(async (log) => {
          const directory = join(logRoot, log, 'ahp')
          try {
            return await readMessages(directory)
          } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
            throw error
          }
        }),
      )
    ).flat()
  }
  const read = async () => taskExecutions(await readLogMessages())
  return {
    async checkpoint(): Promise<Set<string>> {
      return new Set((await read()).map((execution) => execution.key))
    },
    async waitAfter(before: Set<string>, owner?: Execution): Promise<Execution> {
      const executions = await waitFor(
        'the renderer to receive task command completion',
        async () => (await read()).filter((execution) => !before.has(execution.key)),
        (executions) => executions.some((execution) => execution.finished),
      )
      assert.equal(executions.length, 1, 'One task invocation must execute exactly one fixture shell command')
      const execution = executions[0]
      assert.ok(execution.finished)
      if (execution.exitCode !== 0) {
        const messages = await readLogMessages()
        const output = messages
          .filter(
            (message) =>
              message._ahpLog?.dir === 's2c' &&
              message._ahpLog.connectionId === execution.connectionId &&
              message.params?.channel === execution.channel &&
              message.params?.action?.type === 'terminal/data',
          )
          .slice(-20)
          .map((message) => message.params?.action?.data ?? '')
          .join('')
          .slice(-4096)
        assert.fail(`The fixture task must complete successfully: ${JSON.stringify({ execution, output })}`)
      }
      if (owner) {
        assert.equal(execution.channel, owner.channel, 'Hidden task must reuse the same terminal channel')
        assert.equal(execution.connectionId, owner.connectionId, 'Task reuse must stay on the same live connection')
      }
      return execution
    },
  }
}
