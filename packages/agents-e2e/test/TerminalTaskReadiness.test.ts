import { expect, test } from '@jest/globals'
import { taskExecutions } from '../helpers/TerminalTaskReadiness.ts'

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
