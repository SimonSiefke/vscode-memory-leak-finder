import type { Probot } from 'probot'
import { getEnv } from '../Env/Env.ts'
import { handleIssueComment } from '../HandleIssueComment/HandleIssueComment.ts'
import { handleWorkflowRunCompleted } from '../HandleWorkflowRunCompleted/HandleWorkflowRunCompleted.ts'

export const app = (app: Probot): void => {
  const env = getEnv(process.env)

  app.on('issue_comment.created', async (context) => {
    await handleIssueComment({
      env,
      octokit: context.octokit,
      payload: context.payload,
    })
  })

  app.on('workflow_run.completed', async (context) => {
    await handleWorkflowRunCompleted({
      octokit: context.octokit,
      payload: context.payload,
      workflowFileName: env.workflowFileName,
    })
  })
}
