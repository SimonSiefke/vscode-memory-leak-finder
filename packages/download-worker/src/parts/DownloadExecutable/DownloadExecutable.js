import { join } from 'path'
import * as Assert from '../Assert/Assert.js'
import * as Download from '../Download/Download.js'
import * as GetDownloadUrls from '../GetDownloadUrls/GetDownloadUrls.js'
import * as Root from '../Root/Root.js'

export const downloadExecutable = async (name, revision, hostPlatform) => {
  Assert.string(name)
  Assert.string(revision)
  Assert.string(hostPlatform)
  console.info(`downloading ${name}`)
  const urls = GetDownloadUrls.getDownloadUrls(name, revision, hostPlatform)
  const outfile = join(Root.root, `${name}-linux`)
  await Download.download(name, urls, outfile)
  // TODO extract zip file
  // TODO chmod binary
  // TODO use platform dependent cache folder for executable
}
