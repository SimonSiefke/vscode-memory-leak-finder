import { join } from 'node:path'
import { downloadAndExtract } from '../DownloadAndExtract/DownloadAndExtract.ts'
import { root } from '../Root/Root.ts'

const version = '0.31.2025082904'
const urlPlaceHolder = `https://marketplace.visualstudio.com/_apis/public/gallery/publishers/GitHub/vsextensions/copilot-chat/$VERSION/vspackage`
const url = urlPlaceHolder.replace('$VERSION', version)

const downloadGithubCopilot = async () => {
  const outDir = join(root, '.vscode-tool-downloads', 'github-copilot-extracted')
  await downloadAndExtract(`github-copilot`, [url], outDir)
}

await downloadGithubCopilot()
