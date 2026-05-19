import type { Handler, Probot } from 'probot'
import type { BotEnv } from '../Env/Env.ts'
import { getEnv } from '../Env/Env.ts'
import { createHandleUserDataDownloadRequest } from '../HandleUserDataDownloadRequest/HandleUserDataDownloadRequest.ts'
import { handleUploadUserDataPageRequest } from '../HandleUploadUserDataPageRequest/HandleUploadUserDataPageRequest.ts'
import { handleIssueComment } from '../HandleIssueComment/HandleIssueComment.ts'
import { createHandleUserDataUploadRequest } from '../HandleUserDataUploadRequest/HandleUserDataUploadRequest.ts'
import { handleHomePageRequest } from '../HomePage/HomePage.ts'
import { handleWorkflowRunCompleted } from '../HandleWorkflowRunCompleted/HandleWorkflowRunCompleted.ts'

export const createApp = (env: BotEnv) => {
  return (app: Probot, { addHandler }: { addHandler: (handler: Handler) => void }): void => {
    addHandler(handleHomePageRequest)
    addHandler(handleUploadUserDataPageRequest)
    addHandler(createHandleUserDataUploadRequest(env))
    addHandler(createHandleUserDataDownloadRequest(env))

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
}

export const app = createApp(getEnv(process.env))
