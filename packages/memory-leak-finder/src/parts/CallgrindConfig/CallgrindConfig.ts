import path from 'node:path'
import * as Root from '../Root/Root.ts'

export interface CallgrindConfig {
  readonly spoolDir: string
  readonly vgdbPrefix: string
}

export const getCallgrindConfig = (connectionId: number): CallgrindConfig => {
  if (!Number.isFinite(connectionId)) {
    throw new Error(`Invalid Callgrind connection id: ${connectionId}`)
  }
  const name = `vmlf-callgrind-${connectionId}`
  return {
    spoolDir: path.join(Root.root, '.vscode-callgrind', name),
    vgdbPrefix: name,
  }
}
