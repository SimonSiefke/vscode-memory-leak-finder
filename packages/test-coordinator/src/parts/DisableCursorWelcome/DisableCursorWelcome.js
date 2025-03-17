import { join } from 'path'
import * as JsonRpc from '../JsonRpc/JsonRpc.js'
import * as Root from '../Root/Root.js'
import * as StorageWorker from '../StorageWorker/StorageWorker.js'

export const disableCursorWelcome = async () => {
  const storagePath = join(Root.root, '.vscode-global-storage', 'state.vscedb')
  // TODO this would need to happen in multiple steps
  // 1. launch cursor initially, creating the global storage file
  // 2. close cursor
  // 3. using sql, insert the rows to skip welcome
  const storageIpc = await StorageWorker.launch()
  await JsonRpc.invoke(storageIpc, 'Storage.skipCursorWelcome', storagePath)
}
