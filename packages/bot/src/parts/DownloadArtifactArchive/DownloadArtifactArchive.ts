type ArtifactRecord = {
  readonly archive_download_url: string
  readonly name: string
}

type ArtifactDownloadOctokit = {
  readonly auth: (options: { type: 'installation' }) => Promise<{ token: string } | unknown>
}

const getToken = async (octokit: ArtifactDownloadOctokit): Promise<string> => {
  const authResult = await octokit.auth({ type: 'installation' })
  if (!authResult || typeof authResult !== 'object' || !('token' in authResult) || typeof authResult.token !== 'string') {
    throw new Error('Failed to authenticate the artifact download request')
  }
  return authResult.token
}

export const downloadArtifactArchive = async (octokit: ArtifactDownloadOctokit, artifact: ArtifactRecord): Promise<Buffer> => {
  const token = await getToken(octokit)
  const response = await fetch(artifact.archive_download_url, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'vscode-memory-leak-finder-bot',
    },
    signal: AbortSignal.timeout(30_000),
  })
  if (!response.ok) {
    throw new Error(`Failed to download artifact ${artifact.name}: ${response.status}`)
  }
  return Buffer.from(await response.arrayBuffer())
}
