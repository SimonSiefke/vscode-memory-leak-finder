import { getWorkflowArtifactUrl } from '../GetWorkflowArtifactUrl/GetWorkflowArtifactUrl.ts'

export const getWorkflowArtifactVideoUrl = (baseUrl: string, installationId: number, artifactId: number): string => {
  return getWorkflowArtifactUrl(baseUrl, 'video', installationId, artifactId)
}
