import { join } from '../Path/Path.ts'
import * as Root from '../Root/Root.ts'

export interface CallgrindConfig {
  readonly enabled: boolean
  readonly spoolDir: string
  readonly vgdbPrefix: string
}

export const getCallgrindConfig = (measureId: string, connectionId: number): CallgrindConfig => {
  const enabled = measureId === 'callgrind'
  const safeConnectionId = Number.isFinite(connectionId) ? connectionId : process.pid
  const name = `vmlf-callgrind-${safeConnectionId}`
  return {
    enabled,
    spoolDir: join(Root.root, '.vscode-callgrind', name),
    vgdbPrefix: name,
  }
}
