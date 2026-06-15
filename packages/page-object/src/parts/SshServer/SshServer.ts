import { constants } from 'node:fs'
import { access } from 'node:fs/promises'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { createConnection, createServer } from 'node:net'
import { userInfo } from 'node:os'
import { dirname, join } from 'node:path'
import { spawn } from 'node:child_process'
import type { CreateParams } from '../CreateParams/CreateParams.ts'
import * as Root from '../Root/Root.ts'

const defaultAlias = 'local-test'
const defaultHost = '127.0.0.1'
const defaultTimeout = 120_000

export type SshServerConnection = {
  readonly alias: string
  readonly configPath: string
  readonly host: string
  readonly port: number
  readonly user: string
}

type ServerState = {
  readonly output: string[]
  childProcess?: any
  connection?: SshServerConnection
  exitCode?: number | null
  signalCode?: NodeJS.Signals | null
  sshDir?: string
  sshPath?: string
}

type WaitForPortOptions = {
  readonly host?: string
  readonly port?: number
  readonly timeout?: number
}

type RunProcessResult = {
  readonly exitCode: number | null
  readonly stderr: string
  readonly stdout: string
}

type SshServerDependencies = {
  readonly ensureDirectory: (path: string) => Promise<void>
  readonly findExecutable: (name: string) => Promise<string | undefined>
  readonly getAvailablePort: () => Promise<number>
  readonly getPlatform: () => NodeJS.Platform
  readonly getRootDir: () => string
  readonly getUserName: () => string
  readonly isPortOpen: (port: number, host: string) => Promise<boolean>
  readonly readTextFile: (path: string) => Promise<string>
  readonly removeDirectory: (path: string) => Promise<void>
  readonly runProcess: (command: string, args: readonly string[]) => Promise<RunProcessResult>
  readonly sleep: (milliseconds: number) => Promise<void>
  readonly spawnProcess: typeof spawn
  readonly writeTextFile: (path: string, content: string) => Promise<void>
}

type SshServerCreateParams = {
  readonly page: any
  readonly VError: any
}

type RequiredBinaries = {
  readonly sshKeygenPath: string
  readonly sshPath: string
  readonly sshdPath: string
}

type SshPaths = {
  readonly authorizedKeysPath: string
  readonly clientKeyPath: string
  readonly knownHostsPath: string
  readonly settingsPath: string
  readonly sshConfigPath: string
  readonly sshDir: string
  readonly sshdConfigPath: string
  readonly sshdPidPath: string
  readonly sshHostKeyPath: string
}

const appendOutput = (state: ServerState, chunk: unknown): void => {
  const text = String(chunk || '')
  if (!text) {
    return
  }
  state.output.push(text)
  if (state.output.length > 200) {
    state.output.splice(0, state.output.length - 200)
  }
}

const getOutput = (state: ServerState): string => {
  return state.output.join('')
}

const isPortOpen = async (port: number, host: string): Promise<boolean> => {
  const { promise, resolve } = Promise.withResolvers<boolean>()
  const socket = createConnection({ host, port })
  const finish = (value: boolean) => {
    socket.removeAllListeners()
    socket.destroy()
    resolve(value)
  }
  socket.once('connect', () => finish(true))
  socket.once('error', () => finish(false))
  socket.setTimeout(500, () => finish(false))
  return promise
}

const sleep = async (milliseconds: number): Promise<void> => {
  const { promise, resolve } = Promise.withResolvers<void>()
  setTimeout(resolve, milliseconds)
  await promise
}

const ensureDirectory = async (path: string): Promise<void> => {
  await mkdir(path, { recursive: true })
}

const removeDirectory = async (path: string): Promise<void> => {
  await rm(path, { force: true, recursive: true })
}

const readTextFile = async (path: string): Promise<string> => {
  return readFile(path, 'utf8')
}

const writeTextFile = async (path: string, content: string): Promise<void> => {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, content)
}

const findExecutable = async (name: string): Promise<string | undefined> => {
  const pathValue = process.env.PATH || ''
  const pathEntries = pathValue.split(':').filter(Boolean)
  for (const pathEntry of pathEntries) {
    const candidate = join(pathEntry, name)
    try {
      await access(candidate, constants.X_OK)
      return candidate
    } catch {
      // ignore missing executables
    }
  }
  return undefined
}

const getAvailablePort = async (): Promise<number> => {
  const server = createServer()
  const { promise, resolve, reject } = Promise.withResolvers<number>()
  server.once('error', reject)
  server.listen(0, defaultHost, () => {
    const address = server.address()
    if (!address || typeof address === 'string') {
      reject(new Error('Failed to determine available SSH port'))
      return
    }
    const port = address.port
    server.close((error) => {
      if (error) {
        reject(error)
        return
      }
      resolve(port)
    })
  })
  return promise
}

const runProcess = async (command: string, args: readonly string[]): Promise<RunProcessResult> => {
  const childProcess = spawn(command, [...args], {
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const stdoutChunks: string[] = []
  const stderrChunks: string[] = []
  childProcess.stdout?.on('data', (chunk: unknown) => {
    stdoutChunks.push(String(chunk || ''))
  })
  childProcess.stderr?.on('data', (chunk: unknown) => {
    stderrChunks.push(String(chunk || ''))
  })
  const { promise, reject, resolve } = Promise.withResolvers<RunProcessResult>()
  childProcess.once('error', reject)
  childProcess.once('exit', (exitCode, _signalCode) => {
    resolve({
      exitCode,
      stderr: stderrChunks.join(''),
      stdout: stdoutChunks.join(''),
    })
  })
  return promise
}

const waitForExit = async (childProcess: any, milliseconds: number): Promise<void> => {
  if (!childProcess || childProcess.exitCode !== null || childProcess.signalCode !== null) {
    return
  }
  const { promise, resolve } = Promise.withResolvers<void>()
  childProcess.once('exit', () => resolve())
  await Promise.race([promise, sleep(milliseconds)])
}

const getPaths = (rootDir: string): SshPaths => {
  const userDataDir = join(rootDir, '.vscode-user-data-dir')
  const sshDir = join(userDataDir, 'remote-ssh')
  return {
    authorizedKeysPath: join(sshDir, 'authorized_keys'),
    clientKeyPath: join(sshDir, 'id_ed25519'),
    knownHostsPath: join(sshDir, 'known_hosts'),
    settingsPath: join(userDataDir, 'User', 'settings.json'),
    sshConfigPath: join(sshDir, 'config'),
    sshDir,
    sshdConfigPath: join(sshDir, 'sshd_config'),
    sshdPidPath: join(sshDir, 'sshd.pid'),
    sshHostKeyPath: join(sshDir, 'ssh_host_ed25519_key'),
  }
}

const buildSshdConfig = ({
  authorizedKeysPath,
  host,
  port,
  sshHostKeyPath,
  sshdPidPath,
  user,
}: {
  authorizedKeysPath: string
  host: string
  port: number
  sshHostKeyPath: string
  sshdPidPath: string
  user: string
}): string => {
  return [
    `Port ${port}`,
    `ListenAddress ${host}`,
    `HostKey ${sshHostKeyPath}`,
    `PidFile ${sshdPidPath}`,
    `AuthorizedKeysFile ${authorizedKeysPath}`,
    'PasswordAuthentication no',
    'KbdInteractiveAuthentication no',
    'ChallengeResponseAuthentication no',
    'PubkeyAuthentication yes',
    'PermitRootLogin no',
    'UsePAM no',
    'PrintMotd no',
    'LogLevel VERBOSE',
    'StrictModes no',
    `AllowUsers ${user}`,
    '',
  ].join('\n')
}

const buildSshConfig = ({
  alias,
  clientKeyPath,
  host,
  knownHostsPath,
  port,
  user,
}: {
  alias: string
  clientKeyPath: string
  host: string
  knownHostsPath: string
  port: number
  user: string
}): string => {
  return [
    `Host ${alias}`,
    `    HostName ${host}`,
    `    User ${user}`,
    `    Port ${port}`,
    `    IdentityFile ${clientKeyPath}`,
    '    IdentitiesOnly yes',
    '    BatchMode yes',
    '    ConnectTimeout 5',
    '    StrictHostKeyChecking no',
    `    UserKnownHostsFile ${knownHostsPath}`,
    '    LogLevel ERROR',
    '',
  ].join('\n')
}

const mergeSettings = async (dependencies: SshServerDependencies, settingsPath: string, sshConfigPath: string): Promise<void> => {
  let currentText = '{}\n'
  try {
    currentText = await dependencies.readTextFile(settingsPath)
  } catch {
    // ignore missing settings and create a minimal file
  }
  const currentSettings = JSON.parse(currentText)
  const mergedSettings = {
    ...currentSettings,
    'remote.SSH.configFile': sshConfigPath,
    'remote.SSH.useLocalServer': false,
    'remote.SSH.useExecServer': false,
    'remote.SSH.showLoginTerminal': true,
  }
  await dependencies.writeTextFile(settingsPath, `${JSON.stringify(mergedSettings, null, 2)}\n`)
}

const assertChildStillRunning = (state: ServerState): void => {
  if (state.childProcess && state.childProcess.exitCode !== null) {
    throw new Error(`SSH server exited early with code ${state.childProcess.exitCode}\n${getOutput(state)}`)
  }
  if (state.childProcess && state.childProcess.signalCode !== null) {
    throw new Error(`SSH server exited early with signal ${state.childProcess.signalCode}\n${getOutput(state)}`)
  }
}

const waitForPortInternal = async (
  state: ServerState,
  dependencies: SshServerDependencies,
  { host = defaultHost, port, timeout = defaultTimeout }: WaitForPortOptions,
): Promise<void> => {
  if (typeof port !== 'number') {
    throw new Error('port is required')
  }
  const start = Date.now()
  while (Date.now() - start < timeout) {
    if (await dependencies.isPortOpen(port, host)) {
      return
    }
    assertChildStillRunning(state)
    await dependencies.sleep(250)
  }
  throw new Error(`Timed out waiting for ${host}:${port} to accept connections\n${getOutput(state)}`)
}

const waitForSshProbe = async (
  state: ServerState,
  dependencies: SshServerDependencies,
  connection: SshServerConnection,
  timeout = defaultTimeout,
): Promise<void> => {
  const sshPath = state.sshPath
  if (!sshPath) {
    throw new Error('ssh probe path is missing')
  }
  const start = Date.now()
  let lastError = ''
  while (Date.now() - start < timeout) {
    const result = await dependencies.runProcess(sshPath, ['-F', connection.configPath, connection.alias, 'true'])
    if (result.exitCode === 0) {
      return
    }
    lastError = result.stderr || result.stdout || `ssh exited with code ${result.exitCode}`
    assertChildStillRunning(state)
    await dependencies.sleep(250)
  }
  throw new Error(`Timed out waiting for SSH login to succeed\n${lastError}\n${getOutput(state)}`)
}

const generateKeyPair = async (dependencies: SshServerDependencies, sshKeygenPath: string, keyPath: string): Promise<void> => {
  const result = await dependencies.runProcess(sshKeygenPath, ['-q', '-t', 'ed25519', '-N', '', '-f', keyPath])
  if (result.exitCode !== 0) {
    throw new Error(`ssh-keygen failed for ${keyPath}\n${result.stderr || result.stdout}`)
  }
}

const prepareFiles = async (
  dependencies: SshServerDependencies,
  binaries: RequiredBinaries,
  connection: SshServerConnection,
  paths: SshPaths,
): Promise<void> => {
  await dependencies.removeDirectory(paths.sshDir)
  await dependencies.ensureDirectory(paths.sshDir)
  await generateKeyPair(dependencies, binaries.sshKeygenPath, paths.sshHostKeyPath)
  await generateKeyPair(dependencies, binaries.sshKeygenPath, paths.clientKeyPath)
  const publicKey = await dependencies.readTextFile(`${paths.clientKeyPath}.pub`)
  await dependencies.writeTextFile(paths.authorizedKeysPath, publicKey)
  await dependencies.writeTextFile(
    paths.sshdConfigPath,
    buildSshdConfig({
      authorizedKeysPath: paths.authorizedKeysPath,
      host: connection.host,
      port: connection.port,
      sshHostKeyPath: paths.sshHostKeyPath,
      sshdPidPath: paths.sshdPidPath,
      user: connection.user,
    }),
  )
  await dependencies.writeTextFile(
    paths.sshConfigPath,
    buildSshConfig({
      alias: connection.alias,
      clientKeyPath: paths.clientKeyPath,
      host: connection.host,
      knownHostsPath: paths.knownHostsPath,
      port: connection.port,
      user: connection.user,
    }),
  )
  await mergeSettings(dependencies, paths.settingsPath, paths.sshConfigPath)
}

const requireBinary = async (dependencies: SshServerDependencies, name: string, message: string): Promise<string> => {
  const binaryPath = await dependencies.findExecutable(name)
  if (!binaryPath) {
    throw new Error(message)
  }
  return binaryPath
}

const resolveRequiredBinaries = async (dependencies: SshServerDependencies): Promise<RequiredBinaries> => {
  const platform = dependencies.getPlatform()
  if (platform !== 'linux') {
    throw new Error(
      `Remote - SSH test server requires Linux and a real sshd installation. Current platform: ${platform}. code-server.sh is not a valid Remote - SSH target.`,
    )
  }
  return {
    sshKeygenPath: await requireBinary(
      dependencies,
      'ssh-keygen',
      'OpenSSH binary "ssh-keygen" was not found in PATH. Install the Linux OpenSSH client tools to generate test keys.',
    ),
    sshPath: await requireBinary(
      dependencies,
      'ssh',
      'OpenSSH binary "ssh" was not found in PATH. Install the Linux OpenSSH client to verify the test target before using Remote - SSH.',
    ),
    sshdPath: await requireBinary(
      dependencies,
      'sshd',
      'OpenSSH binary "sshd" was not found in PATH. Install the Linux OpenSSH server to run a real Remote - SSH repro. On Ubuntu: sudo apt update && sudo apt install openssh-server',
    ),
  }
}

export const create = ({ page, VError }: CreateParams) => {
  return createWithDependencies(
    { page, VError },
    {
      ensureDirectory,
      findExecutable,
      getAvailablePort,
      getPlatform: () => process.platform,
      getRootDir: () => Root.root,
      getUserName: () => userInfo().username,
      isPortOpen,
      readTextFile,
      removeDirectory,
      runProcess,
      sleep,
      spawnProcess: spawn,
      writeTextFile,
    },
  )
}

export const createWithDependencies = ({ page, VError }: SshServerCreateParams, dependencies: SshServerDependencies) => {
  const state: ServerState = {
    output: [],
  }

  const getConnection = (): SshServerConnection => {
    if (!state.connection) {
      throw new Error('SSH server has not been launched yet')
    }
    return state.connection
  }

  return {
    async launch(): Promise<SshServerConnection> {
      try {
        const binaries = await resolveRequiredBinaries(dependencies)
        const user = dependencies.getUserName()
        if (!user) {
          throw new Error('Failed to resolve the current OS user for the SSH test target')
        }
        const rootDir = dependencies.getRootDir()
        const port = await dependencies.getAvailablePort()
        const paths = getPaths(rootDir)
        const connection: SshServerConnection = {
          alias: defaultAlias,
          configPath: paths.sshConfigPath,
          host: defaultHost,
          port,
          user,
        }
        state.connection = connection
        state.sshDir = paths.sshDir
        state.sshPath = binaries.sshPath
        await prepareFiles(dependencies, binaries, connection, paths)
        if (!state.childProcess || state.childProcess.exitCode !== null || state.childProcess.signalCode !== null) {
          const childProcess = dependencies.spawnProcess(binaries.sshdPath, ['-D', '-f', paths.sshdConfigPath, '-e'], {
            detached: true,
            stdio: ['ignore', 'pipe', 'pipe'],
          })
          state.childProcess = childProcess
          await dependencies.writeTextFile(paths.sshdPidPath, `${childProcess.pid}\n`)
          childProcess.stdout.on('data', (chunk: unknown) => appendOutput(state, chunk))
          childProcess.stderr.on('data', (chunk: unknown) => appendOutput(state, chunk))
          childProcess.once('exit', (exitCode: number | null, signalCode: NodeJS.Signals | null) => {
            state.exitCode = exitCode
            state.signalCode = signalCode
          })
        }
        await waitForPortInternal(state, dependencies, { host: connection.host, port: connection.port, timeout: defaultTimeout })
        await waitForSshProbe(state, dependencies, connection)
        return connection
      } catch (error) {
        throw new VError(error, `Failed to launch SSH server`)
      }
    },
    async waitForPort({ host = defaultHost, port, timeout = defaultTimeout }: WaitForPortOptions = {}): Promise<void> {
      try {
        const resolvedPort = port || state.connection?.port
        if (typeof resolvedPort !== 'number') {
          throw new Error('port is required')
        }
        await waitForPortInternal(state, dependencies, { host, port: resolvedPort, timeout })
      } catch (error) {
        throw new VError(error, `Failed to wait for SSH server port ${host}:${port || state.connection?.port || ''}`.trim())
      }
    },
    async shouldBeConnected(): Promise<void> {
      try {
        await page.waitForIdle?.()
        await waitForSshProbe(state, dependencies, getConnection(), 10_000)
      } catch (error) {
        throw new VError(error, `Failed to verify SSH server connection`)
      }
    },
    async dispose(): Promise<void> {
      try {
        const childProcess = state.childProcess
        if (childProcess) {
          if (childProcess.exitCode === null && childProcess.signalCode === null) {
            try {
              process.kill(-childProcess.pid, 'SIGTERM')
            } catch {
              childProcess.kill('SIGTERM')
            }
            await waitForExit(childProcess, 5_000)
            if (childProcess.exitCode === null && childProcess.signalCode === null) {
              try {
                process.kill(-childProcess.pid, 'SIGKILL')
              } catch {
                childProcess.kill('SIGKILL')
              }
              await waitForExit(childProcess, 1_000)
            }
          }
          state.childProcess = undefined
        }
        if (state.sshDir) {
          await dependencies.removeDirectory(state.sshDir)
        }
      } catch (error) {
        throw new VError(error, `Failed to dispose SSH server`)
      }
    },
  }
}
