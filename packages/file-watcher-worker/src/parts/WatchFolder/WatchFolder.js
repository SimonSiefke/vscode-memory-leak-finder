import chokidar from 'chokidar'
import * as Assert from '../Assert/Assert.js'
import * as FileWatcherEventType from '../FileWatcherEventType/FileWatcherEventType.js'

export const watchFolder = async (folder, callback) => {
  Assert.string(folder)
  Assert.fn(callback)
  const watcher = chokidar.watch(folder, {})
  const handleChange = (path) => {
    callback({
      jsonrpc: '2.0',
      method: FileWatcherEventType.HandleFileChanged,
      params: [path],
    })
  }
  watcher.on('change', handleChange)
}
