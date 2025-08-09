import * as NodeProcess from 'node:process'

export const stdin: NodeJS.ReadStream = NodeProcess.stdin

export const stdout: NodeJS.WriteStream = NodeProcess.stdout
