import { connectDevtools } from '../ConnectDevtools/ConnectDevtools.ts'
import type { DevToolsConnection } from '../ConnectDevtools/ConnectDevtools.ts'

export const commandMap = {
  'FunctionTracker.connectDevtools': connectDevtools,
}
