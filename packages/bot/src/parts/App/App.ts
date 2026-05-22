import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Probot } from 'probot'
import type { BotEnv } from '../Env/Env.ts'
import { getEnv } from '../Env/Env.ts'
import { createHandleUserDataDownloadRequest } from '../HandleUserDataDownloadRequest/HandleUserDataDownloadRequest.ts'
import { handleHealthRequest } from '../HandleHealthRequest/HandleHealthRequest.ts'
import { handleUploadUserDataPageRequest } from '../HandleUploadUserDataPageRequest/HandleUploadUserDataPageRequest.ts'
import { handleIssueComment } from '../HandleIssueComment/HandleIssueComment.ts'
import { createHandleUserDataUploadRequest } from '../HandleUserDataUploadRequest/HandleUserDataUploadRequest.ts'
import { createHandleWorkflowArtifactVideoRequest } from '../HandleWorkflowArtifactVideoRequest/HandleWorkflowArtifactVideoRequest.ts'
import { handleHomePageRequest } from '../HomePage/HomePage.ts'
import { handleWorkflowRunCompleted } from '../HandleWorkflowRunCompleted/HandleWorkflowRunCompleted.ts'

type RouteHandler = (request: IncomingMessage, response: ServerResponse) => boolean | Promise<boolean>

export const createApp = (env: BotEnv) => {
  return (app: Probot, { addHandler }: { addHandler: (handler: RouteHandler) => void }): void => {
    addHandler(handleHealthRequest)
    addHandler(handleHomePageRequest)
    addHandler(handleUploadUserDataPageRequest)
    addHandler(createHandleUserDataUploadRequest(env))
    addHandler(createHandleUserDataDownloadRequest(env))
    addHandler(createHandleWorkflowArtifactVideoRequest(app, env))

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
