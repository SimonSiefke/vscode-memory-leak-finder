import assert from 'node:assert'
import { createConnection } from 'node:net'
import process from 'node:process'
import type { TestContext } from '../types.js'

interface BuildRequest {
  readonly command: 'build'
  readonly locale: string
}

interface StopRequest {
  readonly command: 'stop'
}

interface SocketResponse {
  readonly error?: string
  readonly locale?: string
  readonly ok: boolean
}

export const skip = true

export const requiresNetwork = true

const docusaurusVersion = '3.10.2'
const locales = ['en', 'fr', 'ja', 'es'] as const
let nextLocaleIndex = 0
let socketPath = ''

const createControlledBuildSource = (): string => {
  return `    await runControlledBuilds(params);
}
async function unlinkSocket(socketPath) {
    try {
        await require("node:fs/promises").unlink(socketPath);
    }
    catch (error) {
        if (!error || error.code !== "ENOENT") {
            throw error;
        }
    }
}
async function listenOnSocket(server, socketPath) {
    await new Promise((resolve, reject) => {
        const handleError = (error) => {
            server.off("error", handleError);
            reject(error);
        };
        server.once("error", handleError);
        server.listen(socketPath, () => {
            server.off("error", handleError);
            resolve();
        });
    });
}
async function closeServer(server) {
    await new Promise((resolve, reject) => {
        server.close((error) => {
            if (error) {
                reject(error);
                return;
            }
            resolve();
        });
    });
}
function sendResponse(socket, response) {
    socket.end(JSON.stringify(response));
}
async function runControlledBuilds(params) {
    const socketPath = process.env.DOCUSAURUS_SOCKET_PATH;
    if (!socketPath) {
        await (0, buildLocale_1.buildLocale)(params);
        return;
    }
    await unlinkSocket(socketPath);
    const {createServer} = require("node:net");
    const stopped = Promise.withResolvers();
    let requestQueue = Promise.resolve();
    const server = createServer((socket) => {
        socket.setEncoding("utf8");
        let input = "";
        socket.on("data", (chunk) => {
            input += chunk;
            if (!input.endsWith("\\n")) {
                return;
            }
            const requestText = input.trim();
            input = "";
            requestQueue = requestQueue
                .then(async () => {
                    const request = JSON.parse(requestText);
                    if (request.command === "stop") {
                        sendResponse(socket, {ok: true});
                        stopped.resolve();
                        return;
                    }
                    if (request.command !== "build" || typeof request.locale !== "string") {
                        throw new Error("Expected a build request with a locale, or a stop request");
                    }
                    await (0, buildLocale_1.buildLocale)({
                        ...params,
                        locale: request.locale,
                    });
                    sendResponse(socket, {
                        locale: request.locale,
                        ok: true,
                    });
                })
                .catch((error) => {
                    sendResponse(socket, {
                        error: error instanceof Error ? error.stack ?? error.message : String(error),
                        ok: false,
                    });
                });
        });
    });
    server.on("error", stopped.reject);
    try {
        await listenOnSocket(server, socketPath);
        await stopped.promise;
        await closeServer(server);
    }
    finally {
        await unlinkSocket(socketPath);
    }
}`
}

const createPatchScriptSource = (buildPath: string): string => {
  const originalBuildLocaleCall = `    await (0, buildLocale_1.buildLocale)(params);
}`
  const controlledBuildSource = createControlledBuildSource()
  return `import {readFile, writeFile} from 'node:fs/promises'

const buildPath = new URL(${JSON.stringify(buildPath)}, import.meta.url)
const configPath = new URL('./docusaurus-site/docusaurus.config.ts', import.meta.url)

const buildSource = await readFile(buildPath, 'utf8')
const originalBuildLocaleCall = ${JSON.stringify(originalBuildLocaleCall)}
if (!buildSource.includes(originalBuildLocaleCall)) {
  throw new Error('The Docusaurus build implementation no longer matches the expected ${docusaurusVersion} source')
}
await writeFile(buildPath, buildSource.replace(originalBuildLocaleCall, ${JSON.stringify(controlledBuildSource)}))

const configSource = await readFile(configPath, 'utf8')
const originalLocales = "    locales: ['en'],"
if (!configSource.includes(originalLocales)) {
  throw new Error('The Docusaurus i18n config no longer matches the expected ${docusaurusVersion} template')
}
await writeFile(configPath, configSource.replace(originalLocales, "    locales: ['en', 'fr', 'ja', 'es'],"))
`
}

const sendSocketRequest = async (request: BuildRequest | StopRequest): Promise<SocketResponse> => {
  const socket = createConnection(socketPath)
  socket.setEncoding('utf8')
  const { promise, reject, resolve } = Promise.withResolvers<SocketResponse>()
  let responseText = ''
  const fail = (error: Error) => {
    socket.destroy()
    reject(error)
  }
  socket.on('data', (chunk: string) => {
    responseText += chunk
  })
  socket.once('error', fail)
  socket.once('end', () => {
    try {
      resolve(JSON.parse(responseText) as SocketResponse)
    } catch (error) {
      reject(new Error(`Docusaurus returned an invalid socket response: ${responseText}`, { cause: error }))
    }
  })
  socket.setTimeout(10 * 60_000, () => {
    fail(new Error(`Timed out waiting for Docusaurus to handle ${request.command} request`))
  })
  socket.write(`${JSON.stringify(request)}\n`)
  return promise
}

export const setup = async ({ Editor, Explorer, ExternalRuntime, Workspace }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Workspace.setFiles([])
  await Explorer.focus()

  const { inspectPort, serverPort } = await ExternalRuntime.createPorts()
  const localDocusaurusRepo = process.env.DOCUSAURUS_LOCAL_REPO
  const localRepoLink = 'docusaurus-local'
  const buildPath = localDocusaurusRepo
    ? `./${localRepoLink}/packages/docusaurus/lib/commands/build/build.js`
    : './docusaurus-site/node_modules/@docusaurus/core/lib/commands/build/build.js'
  const docusaurusBin = localDocusaurusRepo
    ? `../${localRepoLink}/packages/docusaurus/bin/docusaurus.mjs`
    : 'node_modules/@docusaurus/core/bin/docusaurus.mjs'
  const testDocusaurusVersion = localDocusaurusRepo ? '3.10.1' : docusaurusVersion
  socketPath = `/tmp/vscode-memory-leak-finder-docusaurus-${serverPort}.sock`
  nextLocaleIndex = 0
  await ExternalRuntime.startExternalRuntime({
    args: [
      `--inspect=127.0.0.1:${inspectPort}`,
      '--expose-gc',
      docusaurusBin,
      'build',
      '--locale',
      'en',
      '--no-minify',
    ],
    command: process.execPath,
    cwd: 'docusaurus-site',
    entryFile: 'patch-docusaurus.mjs',
    entrySource: createPatchScriptSource(buildPath),
    env: {
      DOCUSAURUS_SOCKET_PATH: socketPath,
    },
    inspectPort,
    runtimeName: 'node',
    serverPort,
    setupCommands: [
      {
        args: [
          '--yes',
          `create-docusaurus@${testDocusaurusVersion}`,
          'docusaurus-site',
          'classic',
          '--typescript',
          '--skip-install',
          '--package-manager',
          'npm',
        ],
        command: 'npx',
      },
      {
        args: ['install', '--package-lock-only'],
        command: 'npm',
        cwd: 'docusaurus-site',
      },
      {
        args: ['ci'],
        command: 'npm',
        cwd: 'docusaurus-site',
      },
      ...(localDocusaurusRepo
        ? [
            {
              args: ['--symbolic', localDocusaurusRepo, localRepoLink],
              command: 'ln',
            },
            {
              args: [
                'docusaurus-site/node_modules/@docusaurus',
                'docusaurus-site/node_modules/@docusaurus-published',
              ],
              command: 'mv',
            },
            {
              args: [
                '--symbolic',
                `${localDocusaurusRepo}/website/node_modules/@docusaurus`,
                'docusaurus-site/node_modules/@docusaurus',
              ],
              command: 'ln',
            },
          ]
        : []),
      {
        args: ['patch-docusaurus.mjs'],
        command: process.execPath,
      },
    ],
    socketPath,
  })
}

export const run = async (): Promise<void> => {
  const locale = locales[nextLocaleIndex++ % locales.length]
  const response = await sendSocketRequest({
    command: 'build',
    locale,
  })
  assert.deepStrictEqual(response, {
    locale,
    ok: true,
  })
}

export const teardown = async ({ Editor, ExternalRuntime, Workspace }: TestContext): Promise<void> => {
  try {
    const response = await sendSocketRequest({
      command: 'stop',
    })
    assert.deepStrictEqual(response, {
      ok: true,
    })
  } finally {
    await ExternalRuntime.dispose()
    await Editor.closeAll()
    await Workspace.setFiles([])
  }
}
