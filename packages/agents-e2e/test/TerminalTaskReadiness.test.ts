import { expect, test } from '@jest/globals'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { connect, taskExecutions } from '../helpers/TerminalTaskReadiness.ts'

const event = (type: string, commandId: string, extra = {}, connectionId = 'local-connection', channel = 'agenthost-terminal:/task') => ({
  params: { channel, action: { type, commandId, ...extra } },
  _ahpLog: { dir: 's2c', connectionId, transport: 'local' },
})
const executed = (commandId = 'cwd') =>
  event('terminal/commandExecuted', commandId, { commandLine: String.raw`printf '%s\t%s\n' "$$" "$PWD" >> .chat-window-task-pids` })

test('requires a matching completion after the shell has started the PID-marker command', () => {
  const messages = [executed()]
  expect(taskExecutions(messages)).toMatchObject([{ finished: false }])
  expect(taskExecutions([...messages, event('terminal/commandFinished', 'other', { exitCode: 0 })])).toMatchObject([{ finished: false }])
  expect(taskExecutions([...messages, event('terminal/commandFinished', 'cwd', { exitCode: 0 })])).toMatchObject([
    { finished: true, exitCode: 0 },
  ])
})

test('does not match completion from another channel or connection with the same command ID', () => {
  const messages = [
    executed(),
    event('terminal/commandFinished', 'cwd', { exitCode: 0 }, 'other-connection'),
    event('terminal/commandFinished', 'cwd', { exitCode: 0 }, 'local-connection', 'agenthost-terminal:/other'),
  ]
  expect(taskExecutions(messages)).toMatchObject([{ finished: false }])
  expect(taskExecutions([...messages, event('terminal/commandFinished', 'cwd', { exitCode: 1 })])).toMatchObject([
    { finished: true, exitCode: 1 },
  ])
})

test('failed task completion reports the command and bounded output from its own connection and channel', async () => {
  const userData = await mkdtemp(join(tmpdir(), 'terminal-task-readiness-'))
  try {
    const directory = join(userData, 'logs', 'current', 'ahp')
    await mkdir(directory, { recursive: true })
    const messages = [
      executed(),
      event('terminal/data', '', { data: 'unrelated output' }, 'other-connection'),
      event('terminal/data', '', { data: 'other terminal output' }, 'local-connection', 'agenthost-terminal:/other'),
      event('terminal/data', '', { data: 'x'.repeat(5000) + 'fixture: command not found' }),
      event('terminal/commandFinished', 'cwd', { exitCode: 127 }),
    ]
    await writeFile(join(directory, 'terminal.jsonl'), messages.map((message) => JSON.stringify(message)).join('\n') + '\n')
    const readiness = await connect(userData)
    let failure = ''
    try {
      await readiness.waitAfter(new Set())
    } catch (error) {
      failure = String(error)
    }
    expect(failure).toContain('"exitCode":127')
    expect(failure).toContain('.chat-window-task-pids')
    expect(failure).toContain('fixture: command not found')
    expect(failure).not.toContain('unrelated output')
    expect(failure).not.toContain('other terminal output')
    expect(failure.length).toBeLessThan(5000)
  } finally {
    await rm(userData, { recursive: true, force: true })
  }
})
