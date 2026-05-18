# Bot

GitHub App bot for on-demand memory leak measurements.

The bot listens for pull request comments such as:

```text
@vscode-memory-leak-finder run --measure named-function-count3 --inspect-extensions
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

4. If you want to receive webhook events from GitHub on your local machine, set `WEBHOOK_PROXY_URL` to a Smee channel URL.

If you want to use the Probot manifest setup flow at `http://localhost:3000`, set `WEBHOOK_PROXY_URL` before you open the setup page. GitHub rejects manifest webhook URLs that point to `localhost`.

## GitHub App Setup

If you run Probot setup flows locally, you can use [packages/bot/app.yml](packages/bot/app.yml) as the app manifest instead of entering the GitHub App metadata manually.

For local setup, the easiest path is:

1. Create a Smee channel at `https://smee.io/new`.
2. Set `WEBHOOK_PROXY_URL` in `packages/bot/.env` to that Smee URL.
3. Start the bot with `npm --prefix packages/bot start`.
4. Open `http://localhost:3000` and use the Probot setup flow.

Without a public webhook URL, GitHub will reject the manifest because `localhost` is not reachable from the public internet.

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
- `Pull requests`: Read-only
- `Metadata`: Read-only

### Subscribed Events

Subscribe the app to these events:

- `Issue comment`
- `Workflow run`

### Workflow Repository Requirements

The target workflow repository must contain the workflow file referenced by `BOT_WORKFLOW_FILE_NAME`. By default, this bot dispatches `measure-on-demand.yml` on the `main` branch of `SimonSiefke/vscode-memory-leak-finder`.

## Production Environment Variables

These variables should be configured in production.

| Variable                            | Required | Description                                                                                                                    |
| ----------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `APP_ID`                            | Yes      | GitHub App ID.                                                                                                                 |
| `PRIVATE_KEY` or `PRIVATE_KEY_PATH` | Yes      | GitHub App private key content or path to the PEM file. `PRIVATE_KEY` is usually the simplest option in container deployments. |
| `WEBHOOK_SECRET`                    | Yes      | Secret used by GitHub to sign webhook deliveries.                                                                              |
| `PORT`                              | No       | HTTP port for the Probot server. Defaults to `3000`. Set this explicitly if your host expects a different port.                |
| `WEBHOOK_PATH`                      | No       | Webhook path for the Probot server. Defaults to `/api/github/webhooks`.                                                        |
| `LOG_LEVEL`                         | No       | Probot log level. Useful values are `info`, `debug`, or `trace`.                                                               |

## Bot Environment Variables

These variables control which users can trigger the bot and which workflow gets dispatched.

| Variable                 | Required | Default                     | Description                                                               |
| ------------------------ | -------- | --------------------------- | ------------------------------------------------------------------------- |
| `BOT_ALLOWED_LOGINS`     | No       | `SimonSiefke`               | Comma-separated list of GitHub logins allowed to trigger runs.            |
| `BOT_WORKFLOW_FILE_NAME` | No       | `measure-on-demand.yml`     | Workflow file name passed to the GitHub Actions dispatch API.             |
| `BOT_WORKFLOW_OWNER`     | No       | `SimonSiefke`               | Owner of the repository that contains the measure workflow.               |
| `BOT_WORKFLOW_REPO`      | No       | `vscode-memory-leak-finder` | Repository that contains the measure workflow.                            |
| `BOT_WORKFLOW_REF`       | No       | `main`                      | Branch or ref used when dispatching the workflow.                         |
| `WEBHOOK_PROXY_URL`      | No       | unset                       | Optional local-development webhook forwarding URL, for example from Smee. |

See `packages/bot/.env.sample` for a concrete example.

## Supported Command Shape

The bot currently accepts mentions using either alias below followed by `run` and supported flags:

- `@vscode-memory-leak-finder`
- `@vscode-memory-leak-finder-bot`

Supported flags:

- `--measure <value>`
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
@vscode-memory-leak-finder run --measure named-function-count3 --inspect-extensions
```
