import assert from 'node:assert/strict'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { readMessages, waitFor } from './InboxCanvasFixture.ts'

interface Message {
  params?: { channel?: string; action?: { type?: string; commandId?: string; commandLine?: string; exitCode?: number } }
  _ahpLog?: { dir: string; connectionId: string; transport: string }
}

export const taskExecutions = (messages: readonly Message[]) => {
  const executions = new Map<string, { key: string; channel: string; connectionId: string; finished: boolean; exitCode?: number }>()
  for (const message of messages) {
    const meta = message._ahpLog
    const channel = message.params?.channel
    const action = message.params?.action
    if (meta?.dir !== 's2c' || meta.transport !== 'local' || !channel || !action?.commandId) continue
    const key = JSON.stringify([meta.connectionId, channel, action.commandId])
    if (action.type === 'terminal/commandExecuted' && action.commandLine?.includes('.chat-window-task-pids')) {
      executions.set(key, { key, channel, connectionId: meta.connectionId, finished: false })
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
  const logs = (await readdir(logRoot)).sort()
  assert.ok(logs.length, 'The real agent-host transport must have a log directory')
  const directory = join(logRoot, logs.at(-1)!, 'ahp')
  const read = async () => taskExecutions(await readMessages(directory))
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
      assert.equal(execution.exitCode, 0, 'The fixture task must complete successfully')
      if (owner) {
        assert.equal(execution.channel, owner.channel, 'Hidden task must reuse the same terminal channel')
        assert.equal(execution.connectionId, owner.connectionId, 'Task reuse must stay on the same live connection')
      }
      return execution
    },
  }
}
