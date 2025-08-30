import { downloadExtensions } from '../DownloadExtensions/DownloadExtensions.ts'

const extensions = [
  {
    id: `GitHub/copilot-chat`,
    version: '0.31.2025082904',
  },
  {
    id: 'GitHub/copilot',
    version: '1.364.1768',
  },
]

const downloadGithubCopilot = async () => {
  await downloadExtensions(extensions)
}

await downloadGithubCopilot()
