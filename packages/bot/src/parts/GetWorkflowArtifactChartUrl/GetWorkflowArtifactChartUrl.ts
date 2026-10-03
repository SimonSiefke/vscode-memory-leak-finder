const encodePathSegments = (value: string): string => {
  return value
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/')
}

export const getWorkflowArtifactChartUrl = (
  baseUrl: string,
  owner: string,
  repo: string,
  runId: number,
  artifactId: number,
  chartPath: string,
): string => {
  const normalizedBaseUrl = `${baseUrl.replace(/\/$/, '')}/`
  const repositoryPath = `${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`
  const url = new URL(
    `/api/workflow-artifacts/chart/${repositoryPath}/${runId}/${artifactId}/${encodePathSegments(chartPath)}`,
    normalizedBaseUrl,
  )
  return url.toString()
}
