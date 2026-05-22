# Bot

GitHub App bot for on-demand memory leak measurements.

The bot listens for pull request comments such as:

```text
@vscode-memory-leak-finder run --measure named-function-count3 --only chat-editor-fix --inspect-extensions
```

When an allowed user posts a supported command, the bot dispatches the configured GitHub Actions workflow, posts a status comment on the pull request, and updates that comment when the workflow finishes.

## What It Does

- Handles `issue_comment.created` events for pull request comments.
- Validates the command syntax and the triggering user.
- Dispatches the configured workflow file, which defaults to `.github/workflows/measure-on-demand.yml`.
- Handles `workflow_run.completed` events for that workflow.
- Downloads the workflow summary artifact and updates the pull request comment with the result.

## Local Development

1. Create a local env file from the sample:

   ```sh
   cp packages/bot/.env.sample packages/bot/.env
   ```

2. Fill in the GitHub App credentials in `packages/bot/.env`.

3. Start the bot from the repository root:

   ```sh
   npm --prefix packages/bot start
   ```

4. If you want to receive webhook events from GitHub on your local machine, set `WEBHOOK_PROXY_URL` to a public URL that forwards requests to your local bot.

If you want to use the Probot manifest setup flow at `http://localhost:3000`, set `WEBHOOK_PROXY_URL` before you open the setup page. GitHub rejects manifest webhook URLs that point to `localhost`.

If you only need webhook delivery forwarding, a Smee channel works. If the measure workflow also needs to download the uploaded user-data zip from your local bot, use a real HTTP tunnel such as Cloudflare Tunnel or ngrok instead. The bot uses `BOT_PUBLIC_BASE_URL` when set, and otherwise falls back to `WEBHOOK_PROXY_URL` for generated download URLs.

## GitHub App Setup

If you run Probot setup flows locally, you can use [packages/bot/app.yml](packages/bot/app.yml) as the app manifest instead of entering the GitHub App metadata manually.

For local setup, the easiest path is:

1. Create a Smee channel at `https://smee.io/new`.
2. Set `WEBHOOK_PROXY_URL` in `packages/bot/.env` to that Smee URL.
3. Start the bot with `npm --prefix packages/bot start`.
4. Open `http://localhost:3000` and use the Probot setup flow.

Without a public webhook URL, GitHub will reject the manifest because `localhost` is not reachable from the public internet.

If you want to trigger measure workflows against a locally running bot and still allow the workflow runner to download `/api/user-data/download`, use a public tunnel URL instead of Smee. For example, expose `http://localhost:3000` through Cloudflare Tunnel and set either `BOT_PUBLIC_BASE_URL` or `WEBHOOK_PROXY_URL` to that tunnel URL.

1. Create a new GitHub App at `https://github.com/settings/apps/new`.
2. Set a homepage URL. The repository URL is fine.
3. Set a webhook URL pointing at the deployed bot. With the default Probot server, the webhook path is `/api/github/webhooks`.
4. Generate and keep a webhook secret.
5. Download the app private key.
6. Install the app on the repositories the bot needs to access.

If the workflow runs in the same repository where pull request comments are created, one installation is enough. If the bot reads comments in one repository and dispatches workflows in another, install the app where it can access both repositories.

### Required Permissions

Configure the app with these repository permissions:

- `Actions`: Read and write
- `Issues`: Read and write
- `Pull requests`: Read and write
- `Metadata`: Read-only

### Subscribed Events

Subscribe the app to these events:

- `Issue comment`
- `Workflow run`

### Workflow Repository Requirements

The target workflow repository must contain the workflow file referenced by `BOT_WORKFLOW_FILE_NAME`. By default, this bot dispatches `measure-on-demand.yml` on the `main` branch of `SimonSiefke/vscode-memory-leak-finder`.

## Production Environment Variables

These variables should be configured in production.

| Variable                            | Required | Description                                                                                                                                    |
| ----------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `APP_ID`                            | Yes      | GitHub App ID.                                                                                                                                 |
| `PRIVATE_KEY` or `PRIVATE_KEY_PATH` | Yes      | GitHub App private key content or path to the PEM file. `PRIVATE_KEY` is usually the simplest option in container deployments.                 |
| `WEBHOOK_SECRET`                    | Yes      | Secret used by GitHub to sign webhook deliveries.                                                                                              |
| `PORT`                              | No       | HTTP port for the Probot server. Defaults to `3000`. Set this explicitly if your host expects a different port.                                |
| `HOST`                              | No       | HTTP host for the Probot server. In production, this bot defaults to `0.0.0.0` so container platforms such as Render can detect the open port. |
| `WEBHOOK_PATH`                      | No       | Webhook path for the Probot server. Defaults to `/api/github/webhooks`.                                                                        |
| `LOG_LEVEL`                         | No       | Probot log level. Useful values are `info`, `debug`, or `trace`.                                                                               |

## Bot Environment Variables

These variables control which users can trigger the bot and which workflow gets dispatched.

| Variable                                 | Required | Default                     | Description                                                                                                        |
| ---------------------------------------- | -------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `BOT_ALLOWED_LOGINS`                     | No       | `SimonSiefke`               | Comma-separated list of GitHub logins allowed to trigger runs.                                                     |
| `BOT_USER_DATA_R2_ACCOUNT_ID`            | No       | unset                       | Cloudflare account ID used to build the private R2 S3 endpoint for server-side downloads.                          |
| `BOT_USER_DATA_R2_ACCESS_KEY_ID`         | No       | unset                       | R2 access key ID used by the bot to sign private S3-compatible `GetObject` requests.                               |
| `BOT_USER_DATA_R2_SECRET_ACCESS_KEY`     | No       | unset                       | R2 secret access key used by the bot to sign private S3-compatible `GetObject` requests.                           |
| `BOT_USER_DATA_R2_BUCKET`                | No       | unset                       | Bucket name that stores the uploaded vscode-user-data-dir snapshot.                                                |
| `BOT_USER_DATA_R2_OBJECT_KEY`            | No       | `.vscode-user-data-dir.zip` | Object key for the snapshot inside the R2 bucket. Leave this unset if you use the default object name.             |
| `BOT_VSCODE_MOCK_REQUESTS_R2_OBJECT_KEY` | No       | `.vscode-mock-requests.zip` | Object key for the uploaded `.vscode-mock-requests` archive in the same private R2 bucket.                         |
| `BOT_VSCODE_PROXY_CERTS_R2_OBJECT_KEY`   | No       | `.vscode-proxy-certs.zip`   | Object key for the uploaded `.vscode-proxy-certs` archive in the same private R2 bucket.                           |
| `BOT_VSCODE_REQUESTS_R2_OBJECT_KEY`      | No       | `.vscode-requests.zip`      | Object key for the uploaded `.vscode-requests` archive in the same private R2 bucket.                              |
| `BOT_USER_DATA_SNAPSHOT_URL`             | No       | unset                       | Direct URL for an externally hosted snapshot. Fallback used only when private R2 proxying is not configured.       |
| `BOT_USER_DATA_SNAPSHOT_TOKEN`           | No       | unset                       | Optional bearer token sent when the workflow downloads `BOT_USER_DATA_SNAPSHOT_URL`.                               |
| `BOT_USER_DATA_UPLOAD_TOKEN`             | No       | unset                       | Shared secret required for `/api/user-data/upload` and for the private snapshot download routes used by workflows. |
| `BOT_PUBLIC_BASE_URL`                    | No       | unset                       | Public base URL used for generated workflow callback and secure snapshot download URLs.                            |
| `BOT_WORKFLOW_FILE_NAME`                 | No       | `measure-on-demand.yml`     | Workflow file name passed to the GitHub Actions dispatch API.                                                      |
| `BOT_WORKFLOW_OWNER`                     | No       | `SimonSiefke`               | Owner of the repository that contains the measure workflow.                                                        |
| `BOT_WORKFLOW_REPO`                      | No       | `vscode-memory-leak-finder` | Repository that contains the measure workflow.                                                                     |
| `BOT_WORKFLOW_REF`                       | No       | `main`                      | Branch or ref used when dispatching the workflow.                                                                  |
| `WEBHOOK_PROXY_URL`                      | No       | unset                       | Optional public webhook URL. Also used as a fallback public base URL when `BOT_PUBLIC_BASE_URL` is unset.          |

See `packages/bot/.env.sample` for a concrete example.

If the `BOT_USER_DATA_R2_*` variables are configured, the bot keeps using secure bot-hosted download URLs for workflows and fetches the archives from private R2 server-side. That includes `/api/user-data/download`, `/api/vscode-mock-requests/download`, `/api/vscode-proxy-certs/download`, and `/api/vscode-requests/download`. This is the recommended setup for Render free web services, because the bucket can stay private and the bot does not rely on a durable local filesystem.

For the private R2 setup, the practical minimum is:

- `BOT_USER_DATA_R2_ACCOUNT_ID`
- `BOT_USER_DATA_R2_ACCESS_KEY_ID`
- `BOT_USER_DATA_R2_SECRET_ACCESS_KEY`
- `BOT_USER_DATA_R2_BUCKET`
- `BOT_PUBLIC_BASE_URL`
- `BOT_USER_DATA_UPLOAD_TOKEN`

`BOT_USER_DATA_R2_OBJECT_KEY` is optional because it defaults to `.vscode-user-data-dir.zip`.
`BOT_VSCODE_MOCK_REQUESTS_R2_OBJECT_KEY`, `BOT_VSCODE_PROXY_CERTS_R2_OBJECT_KEY`, and `BOT_VSCODE_REQUESTS_R2_OBJECT_KEY` are also optional because they default to `.vscode-mock-requests.zip`, `.vscode-proxy-certs.zip`, and `.vscode-requests.zip`.

The bot does not use a generic Cloudflare API key here. It talks to R2 through the S3-compatible object endpoint, so it needs the account-specific R2 endpoint plus an R2 access key pair to sign the request. A bucket name alone is not enough to build or authenticate that request.

If `BOT_USER_DATA_SNAPSHOT_URL` is set and the R2 variables are not configured, the bot uses that external snapshot for workflow runs instead of requiring a locally uploaded snapshot on disk.

## Supported Command Shape

The bot currently accepts mentions using either alias below followed by `run` and supported flags:

- `@vscode-memory-leak-finder`
- `@vscode-memory-leak-finder-bot`

Supported flags:

- `--measure <value>`
- `--only <value>`
- `--inspect-extensions`
- `--inspect-shared-process`
- `--inspect-ptyhost`
- `--measure-node`
- `--restart-between`
- `--run-skipped-tests-anyway`
- `--runs <value>`
- `--process-root-strategy <value>`

Example:

```text
@vscode-memory-leak-finder run --measure named-function-count3 --only chat-editor-fix --inspect-extensions
```
