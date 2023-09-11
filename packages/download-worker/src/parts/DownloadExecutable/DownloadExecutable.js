import { join } from 'path'
import * as Assert from '../Assert/Assert.js'
import * as DownloadAndExtract from '../DownloadAndExtract/DownloadAndExtract.js'
import * as GetDownloadUrls from '../GetDownloadUrls/GetDownloadUrls.js'
import * as MakeExecutable from '../MakeExecutable/MakeExecutable.js'
import * as Root from '../Root/Root.js'

export const downloadExecutable = async (name, revision, hostPlatform, executablePath) => {
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
