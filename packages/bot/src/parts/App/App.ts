import type { Probot } from 'probot'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { BotEnv } from '../Env/Env.ts'
import { getEnv } from '../Env/Env.ts'
import { createHandleUserDataDownloadRequest } from '../HandleUserDataDownloadRequest/HandleUserDataDownloadRequest.ts'
import { handleUploadUserDataPageRequest } from '../HandleUploadUserDataPageRequest/HandleUploadUserDataPageRequest.ts'
import { handleIssueComment } from '../HandleIssueComment/HandleIssueComment.ts'
import { createHandleUserDataUploadRequest } from '../HandleUserDataUploadRequest/HandleUserDataUploadRequest.ts'
import { handleHomePageRequest } from '../HomePage/HomePage.ts'
import { handleWorkflowRunCompleted } from '../HandleWorkflowRunCompleted/HandleWorkflowRunCompleted.ts'

export const createApp = (env: BotEnv) => {
  return (
    app: Probot,
    {
      addHandler,
    }: { addHandler: (handler: (req: IncomingMessage, res: ServerResponse) => void | boolean | Promise<void | boolean>) => void },
  ): void => {
    addHandler(handleHomePageRequest)
    addHandler(handleUploadUserDataPageRequest)
    addHandler(createHandleUserDataUploadRequest(env))
    addHandler(createHandleUserDataDownloadRequest(env))

    app.on('issue_comment.created', async (context) => {
      await handleIssueComment({
        env,
        octokit: context.octokit,
        payload: {
          comment: {
            body: context.payload.comment.body,
            id: context.payload.comment.id,
            user: context.payload.comment.user ? { login: context.payload.comment.user.login } : null,
          },
          issue: {
            number: context.payload.issue.number,
            ...(context.payload.issue.pull_request ? { pull_request: context.payload.issue.pull_request } : {}),
          },
          repository: {
            name: context.payload.repository.name,
            owner: {
              login: context.payload.repository.owner.login,
            },
          },
        },
      })
    })

    app.on('workflow_run.completed', async (context) => {
      await handleWorkflowRunCompleted({
        octokit: context.octokit,
        payload: {
          repository: {
            name: context.payload.repository.name,
            owner: {
              login: context.payload.repository.owner.login,
            },
          },
          workflow_run: {
            conclusion: context.payload.workflow_run.conclusion,
            html_url: context.payload.workflow_run.html_url,
            id: context.payload.workflow_run.id,
            ...(context.payload.workflow_run.path ? { path: context.payload.workflow_run.path } : {}),
          },
        },
        workflowFileName: env.workflowFileName,
      })
    })
  }
}

export const app = createApp(getEnv(process.env))
