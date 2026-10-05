import type { Rpc } from '@lvce-editor/rpc'

export const emptyRpc: Rpc = {
  async dispose() {},
  invoke() {
    throw new Error(`not implemented`)
  },
  async invokeAndTransfer() {},
  send() {},
}
