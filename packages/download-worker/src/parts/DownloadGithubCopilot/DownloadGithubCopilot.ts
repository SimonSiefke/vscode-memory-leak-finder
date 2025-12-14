import { downloadExtensions } from '../DownloadExtensions/DownloadExtensions.ts'

const extensions = [
  {
    id: `GitHub/copilot-chat`,
    version: '0.33.5',
  },
  {
    id: 'GitHub/copilot',
    version: '1.388.0',
  },
]

const downloadGithubCopilot = async () => {
  await downloadExtensions(extensions)
}

await downloadGithubCopilot()
