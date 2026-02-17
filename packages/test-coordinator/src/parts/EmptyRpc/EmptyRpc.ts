import type { Rpc } from '@lvce-editor/rpc'

export const emptyRpc: Rpc = {
  async invokeAndTransfer() {},
  send() {},
  async dispose() {},
  invoke() {
    throw new Error(`not implemented`)
  },
}
