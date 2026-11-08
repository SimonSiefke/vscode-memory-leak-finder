// Keep repository-qualified identities in results while adapting to the build CLI's owner/SHA syntax.
export const parseCommitReference = (value: string) => {
  const match = /^(?:([a-z0-9](?:[a-z0-9-]{0,38}))\/vscode@)?([0-9a-f]{40})$/i.exec(value)
  if (!match || match[0] !== value) throw new Error('Commit must be a full 40-character SHA or owner/vscode@<full 40-character SHA>')
  const owner = (match[1] ?? 'microsoft').toLowerCase()
  const sha = match[2]!.toLowerCase()
  return {
    reference: match[1] ? `${owner}/vscode@${sha}` : sha,
    sha,
    owner,
    buildReference: owner === 'microsoft' ? sha : `${owner}/${sha}`,
    artifact: owner === 'microsoft' ? sha : `${owner}-vscode-${sha}`,
  }
}

export const commitLabel = (value: string): string => {
  const { reference, sha } = parseCommitReference(value)
  return reference.replace(sha, sha.slice(0, 10))
}
