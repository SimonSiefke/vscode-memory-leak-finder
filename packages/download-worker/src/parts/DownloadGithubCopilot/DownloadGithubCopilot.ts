import { downloadExtensions } from '../DownloadExtensions/DownloadExtensions.ts'

const extensions = [
  {
    id: `GitHub/copilot-chat`,
    version: '0.30.3',
  },
  {
    id: 'GitHub/copilot',
    version: '1.364.0',
  },
]

const downloadGithubCopilot = async () => {
  await downloadExtensions(extensions)
}

await downloadGithubCopilot()
