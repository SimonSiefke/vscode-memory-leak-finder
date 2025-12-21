import { VError } from '@lvce-editor/verror'

export interface Commit {
  commit: string
}

export const fetchCommits = async (): Promise<Commit[]> => {
  const url = 'https://update.code.visualstudio.com/api/commits/insider/linux-x64?released=false'
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'vscode-memory-leak-finder/1.0.0',
      },
      signal: AbortSignal.timeout(30_000),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const commitHashes = (await response.json()) as string[]
    const recentCommits = commitHashes.slice(0, 200).map((commit) => ({
      commit,
    }))
    return recentCommits
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      throw new Error('Request timeout')
    }
    throw new VError(error, 'Failed to fetch commits')
  }
}
