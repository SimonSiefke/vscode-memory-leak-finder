import { join } from 'node:path'
import * as LaunchFileSystemWorker from '../LaunchFileSystemWorker/LaunchFileSystemWorker.ts'
import * as Root from '../Root/Root.ts'

export const runBuild = async (): Promise<void> => {
  const rpc = await LaunchFileSystemWorker.launchFileSystemWorker()
  await rpc.invoke('FileSystem.exec', `npm`, ['run', 'build'], {
    cwd: join(Root.root, 'packages', 'build'),
  })
  await rpc.dispose()
}
