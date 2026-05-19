import type { IncomingMessage, ServerResponse } from 'node:http'

const homePageHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>VS Code Memory Leak Finder Bot</title>
    <style>
      :root {
        color-scheme: light;
        font-family: Georgia, 'Times New Roman', serif;
        background: #f7f1e3;
        color: #18230f;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 24px;
        background:
          radial-gradient(circle at top right, rgba(201, 167, 92, 0.3), transparent 30%),
          linear-gradient(180deg, #f7f1e3 0%, #efe6d3 100%);
      }

      main {
        max-width: 720px;
        width: 100%;
        padding: 32px;
        border: 1px solid rgba(24, 35, 15, 0.12);
        border-radius: 20px;
        background: rgba(255, 251, 243, 0.94);
        box-shadow: 0 20px 60px rgba(24, 35, 15, 0.12);
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      h1 {
        margin: 0;
        font-size: clamp(2rem, 5vw, 3.4rem);
        line-height: 1;
        letter-spacing: -0.04em;
      }

      p,
      li {
        font-size: 1rem;
        line-height: 1.6;
      }

      p {
        margin: 0;
      }

      ul {
        margin: 0;
        padding-left: 20px;
      }

      code {
        font-family: 'Courier New', monospace;
        font-size: 0.95em;
      }

      a {
        color: inherit;
      }

      .endpoint-link {
        display: inline-flex;
        align-items: center;
        padding: 2px 8px;
        border: 1px solid rgba(107, 79, 29, 0.24);
        border-radius: 999px;
        background: rgba(107, 79, 29, 0.12);
        color: #6b4f1d;
        font-family: 'Courier New', monospace;
        font-size: 0.95em;
        font-weight: 700;
        text-decoration: underline;
        text-underline-offset: 0.16em;
      }

      .eyebrow {
        font-size: 0.82rem;
        font-weight: 700;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: #8a6b2d;
      }

      .panel {
        padding: 18px 20px;
        border-radius: 14px;
        background: rgba(138, 107, 45, 0.08);
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
    </style>
  </head>
  <body>
    <main>
      <div class="eyebrow">GitHub App</div>
      <h1>VS Code Memory Leak Finder Bot</h1>
      <p>GitHub App bot for on-demand memory leak measurements.</p>
      <div class="panel">
        <p>The bot watches pull request comments for supported commands, starts the configured measurement workflow, and updates the pull request with progress and results.</p>
        <p>Webhook endpoint: <a class="endpoint-link" href="/api/github/webhooks">/api/github/webhooks</a></p>
        <p>Upload user data dir: <a class="endpoint-link" href="/api/user-data/upload">/api/user-data/upload</a></p>
        <p>Upload page: <a class="endpoint-link" href="/upload-user-data-dir">/upload-user-data-dir</a></p>
      </div>
      <div class="panel">
        <p>Example command:</p>
        <p><code>@vscode-memory-leak-finder run --measure named-function-count3 --only chat-editor-fix --inspect-extensions</code></p>
      </div>
    </main>
  </body>
</html>
`

export const handleHomePageRequest = (request: IncomingMessage, response: ServerResponse): boolean => {
  if (request.method !== 'GET') {
    return false
  }
  const path = request.url?.split('?')[0] ?? ''
  if (path !== '/') {
    return false
  }
  response.writeHead(200, {
    'content-type': 'text/html; charset=utf-8',
  })
  response.end(homePageHtml)
  return true
}
