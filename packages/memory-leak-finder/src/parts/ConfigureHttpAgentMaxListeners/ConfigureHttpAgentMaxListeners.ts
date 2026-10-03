import http from 'node:http'
import https from 'node:https'
import type { Socket } from 'node:net'

// Source-map batches can legitimately share a keep-alive socket across many
// in-flight requests while a full heap is being attributed.
const maxSocketListeners = 100
const configuredAgents = new WeakSet<object>()

const setSocketMaxListeners = (socket: Socket): void => {
  if (socket.getMaxListeners() < maxSocketListeners) {
    socket.setMaxListeners(maxSocketListeners)
  }
}

const configureAgent = (agent: http.Agent | https.Agent): void => {
  if (configuredAgents.has(agent)) {
    return
  }
  configuredAgents.add(agent)
  agent.prependListener('free', setSocketMaxListeners)
}

export const configureHttpAgentMaxListeners = (): void => {
  configureAgent(http.globalAgent)
  configureAgent(https.globalAgent)
}
