// @ts-ignore
import * as FileWatcherCommandType from '../FileWatcherCommandType/FileWatcherCommandType.js'
// @ts-ignore
import * as WatchFile from '../WatchFile/WatchFile.js'
// @ts-ignore
import * as WatchFolder from '../WatchFolder/WatchFolder.js'

export const getFn = (method) => {
  switch (method) {
    case FileWatcherCommandType.WatchFile:
      return WatchFile.watchFile
    case FileWatcherCommandType.WatchFolder:
      return WatchFolder.watchFolder
    default:
      throw new Error(`unexpected method ${method}`)
  }
}
