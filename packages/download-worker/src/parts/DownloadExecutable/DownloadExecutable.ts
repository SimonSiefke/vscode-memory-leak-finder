import { join } from 'path'
import * as Assert from '../Assert/Assert.ts'
import * as DownloadAndExtract from '../DownloadAndExtract/DownloadAndExtract.ts'
import * as GetDownloadUrls from '../GetDownloadUrls/GetDownloadUrls.ts'
import * as MakeExecutable from '../MakeExecutable/MakeExecutable.ts'
import * as Root from '../Root/Root.ts'

export const downloadExecutable = async (name: string, revision: string, hostPlatform: string, executablePath: string[]): Promise<void> => {
  Assert.string(name)
  Assert.string(revision)
  Assert.string(hostPlatform)
  console.info(`downloading ${name}`)
  const urls = GetDownloadUrls.getDownloadUrls(name, revision, hostPlatform)
  const outDir = join(Root.root, '.vscode-ffmpeg')
  await DownloadAndExtract.downloadAndExtract(name, urls, outDir)
  const outFile = join(outDir, ...executablePath)
  await MakeExecutable.makeExecutable(outFile)
  // TODO extract zip file
  // TODO chmod binary
  // TODO use platform dependent cache folder for executable
}
