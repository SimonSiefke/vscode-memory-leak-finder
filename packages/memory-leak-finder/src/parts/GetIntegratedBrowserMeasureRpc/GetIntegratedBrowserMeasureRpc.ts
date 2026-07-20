import type { Dynamic } from '../Types/Types.ts'
import * as DebuggerCreateSessionRpcConnection from '../DebuggerCreateSessionRpcConnection/DebuggerCreateSessionRpcConnection.ts'
import { DevtoolsProtocolTarget } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

interface TargetInfo {
  readonly targetId: string
  readonly title?: string
  readonly type: string
  readonly url?: string
}

const isHttpPageTarget = (target: TargetInfo, excludedTargetIds: ReadonlySet<string>): boolean => {
  return target.type === 'page' && !excludedTargetIds.has(target.targetId) && /^https?:\/\//.test(target.url || '')
}

const formatPageTargets = (targets: readonly TargetInfo[]): string => {
  const pageTargets = targets.filter((target) => target.type === 'page')
  if (pageTargets.length === 0) {
    return '<none>'
  }
  return pageTargets
    .map((target) => {
      return `${target.targetId}:${target.url || '<empty>'}:${target.title || '<untitled>'}`
    })
    .join(', ')
}

export const getIntegratedBrowserMeasureRpc = async (browserRpc: Dynamic, excludedTargetIds: readonly string[]): Promise<Dynamic> => {
  const targets = (await DevtoolsProtocolTarget.getTargets(browserRpc)) as readonly TargetInfo[]
  const excluded = new Set(excludedTargetIds)
  const target = targets.find((entry) => isHttpPageTarget(entry, excluded))
  if (!target) {
    throw new Error(`Failed to find new integrated browser HTTP(S) page target. Available page targets: ${formatPageTargets(targets)}`)
  }
  const sessionId = await DevtoolsProtocolTarget.attachToTarget(browserRpc, {
    flatten: true,
    targetId: target.targetId,
  })
  const sessionRpc = DebuggerCreateSessionRpcConnection.createSessionRpcConnection(browserRpc, sessionId, target.targetId)
  await DevtoolsProtocolTarget.setAutoAttach(sessionRpc, {
    autoAttach: true,
    flatten: true,
    waitForDebuggerOnStart: false,
  })
  return sessionRpc
}
