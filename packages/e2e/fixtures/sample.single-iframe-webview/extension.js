const vscode = require('vscode')

exports.activate = (context) => {
  context.subscriptions.push(
    vscode.commands.registerCommand('test.showSingleIframeWebview', () => {
      const startedAt = performance.now()
      const mediaRoot = vscode.Uri.joinPath(context.extensionUri, 'media')
      const panel = vscode.window.createWebviewPanel('singleIframeWebviewTest', 'Single-Iframe Webview Test', vscode.ViewColumn.One, {
        enableScripts: true,
        localResourceRoots: [mediaRoot],
      })
      const script = panel.webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, 'main.js'))
      const style = panel.webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, 'style.css'))
      const image = panel.webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, 'image.svg'))
      panel.webview.html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${panel.webview.cspSource}; style-src ${panel.webview.cspSource}; script-src ${panel.webview.cspSource};">
    <link rel="stylesheet" href="${style}">
  </head>
  <body>
    <h1 id="single-iframe-webview-content">Single iframe webview benchmark fixture</h1>
    <img id="fixture-image" src="${image}" alt="Fixture image">
    <p id="single-iframe-webview-status">Waiting for resources and API message</p>
    <script src="${script}"></script>
  </body>
</html>`
      panel.webview.onDidReceiveMessage((message) => {
        if (message.type === 'ready') {
          void panel.webview.postMessage({ type: 'ping' })
        }
        if (message.type === 'complete') {
          const durationMs = performance.now() - startedAt
          void panel.webview.postMessage({ durationMs, type: 'measurement' })
        }
      })
    }),
  )
}
