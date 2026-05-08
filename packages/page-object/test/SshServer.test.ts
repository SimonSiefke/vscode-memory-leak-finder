import { expect, test } from '@jest/globals'
import { EventEmitter } from 'node:events'
import { createWithDependencies } from '../src/parts/SshServer/SshServer.ts'

class MockChildProcess extends EventEmitter {
  stdout = new EventEmitter()
  stderr = new EventEmitter()
  exitCode: number | null = null
  signalCode: NodeJS.Signals | null = null
  pid = 123

  kill(): void {}
}

const createMockVError = class MockVError extends Error {
  constructor(error: unknown, message: string) {
    super(`${message}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

test('launch starts sshd, writes repo-local config, and waits for ssh probe', async () => {
  const childProcess = new MockChildProcess()
  const calls: string[] = []
  const writtenFiles = new Map<string, string>()
  const rootDir = '/repo'
  const sshDir = '/repo/.vscode-user-data-dir/remote-ssh'
  const clientKeyPath = '/repo/.vscode-user-data-dir/remote-ssh/id_ed25519'
  const sshConfigPath = '/repo/.vscode-user-data-dir/remote-ssh/config'
  const sshdConfigPath = '/repo/.vscode-user-data-dir/remote-ssh/sshd_config'
  const settingsPath = '/repo/.vscode-user-data-dir/User/settings.json'
  let portChecks = 0
  let sshChecks = 0

  const sshServer = createWithDependencies(
    {
      page: {},
      VError: createMockVError,
    },
    {
      ensureDirectory: async (path: string) => {
        calls.push(`ensureDirectory:${path}`)
      },
      findExecutable: async (name: string) => `/usr/bin/${name}`,
      getAvailablePort: async () => 2222,
      getPlatform: () => 'linux',
      getRootDir: () => rootDir,
      getUserName: () => 'simon',
      isPortOpen: async () => {
        portChecks += 1
        calls.push(`isPortOpen:${portChecks}`)
        return portChecks >= 2
      },
      readTextFile: async (path: string) => {
        calls.push(`readTextFile:${path}`)
        if (path === settingsPath) {
          return '{\n  "window.titleBarStyle": "custom"\n}\n'
        }
        if (path === `${clientKeyPath}.pub`) {
          return 'ssh-ed25519 AAAATEST local-test\n'
        }
        throw new Error(`unexpected read: ${path}`)
      },
      removeDirectory: async (path: string) => {
        calls.push(`removeDirectory:${path}`)
      },
      runProcess: async (command: string, args: readonly string[]) => {
        calls.push(`runProcess:${command}:${args.join(' ')}`)
        if (command === '/usr/bin/ssh-keygen') {
          return { exitCode: 0, stderr: '', stdout: '' }
        }
        if (command === '/usr/bin/ssh') {
          sshChecks += 1
          return sshChecks === 1 ? { exitCode: 255, stderr: 'connection refused', stdout: '' } : { exitCode: 0, stderr: '', stdout: '' }
        }
        throw new Error(`unexpected command: ${command}`)
      },
      sleep: async () => {
        calls.push('sleep')
      },
      spawnProcess: ((command: string, args: readonly string[]) => {
        calls.push(`spawn:${command}:${args.join(' ')}`)
        return childProcess as any
      }) as any,
      writeTextFile: async (path: string, content: string) => {
        calls.push(`writeTextFile:${path}`)
        writtenFiles.set(path, content)
      },
    },
  )

  const connection = await sshServer.launch()

  expect(connection).toEqual({
    alias: 'local-test',
    configPath: sshConfigPath,
    host: '127.0.0.1',
    port: 2222,
    user: 'simon',
  })
  expect(calls).toEqual([
    `removeDirectory:${sshDir}`,
    `ensureDirectory:${sshDir}`,
    'runProcess:/usr/bin/ssh-keygen:-q -t ed25519 -N  -f /repo/.vscode-user-data-dir/remote-ssh/ssh_host_ed25519_key',
    'runProcess:/usr/bin/ssh-keygen:-q -t ed25519 -N  -f /repo/.vscode-user-data-dir/remote-ssh/id_ed25519',
    `readTextFile:${clientKeyPath}.pub`,
    `writeTextFile:${sshDir}/authorized_keys`,
    `writeTextFile:${sshdConfigPath}`,
    `writeTextFile:${sshConfigPath}`,
    `readTextFile:${settingsPath}`,
    `writeTextFile:${settingsPath}`,
    'spawn:/usr/bin/sshd:-D -f /repo/.vscode-user-data-dir/remote-ssh/sshd_config -e',
    'isPortOpen:1',
    'sleep',
    'isPortOpen:2',
    'runProcess:/usr/bin/ssh:-F /repo/.vscode-user-data-dir/remote-ssh/config local-test true',
    'sleep',
    'runProcess:/usr/bin/ssh:-F /repo/.vscode-user-data-dir/remote-ssh/config local-test true',
  ])
  expect(writtenFiles.get(`${sshDir}/authorized_keys`)).toEqual('ssh-ed25519 AAAATEST local-test\n')
  expect(writtenFiles.get(sshdConfigPath)).toEqual(
    'Port 2222\n' +
      'ListenAddress 127.0.0.1\n' +
      'HostKey /repo/.vscode-user-data-dir/remote-ssh/ssh_host_ed25519_key\n' +
      'PidFile /repo/.vscode-user-data-dir/remote-ssh/sshd.pid\n' +
      'AuthorizedKeysFile /repo/.vscode-user-data-dir/remote-ssh/authorized_keys\n' +
      'PasswordAuthentication no\n' +
      'KbdInteractiveAuthentication no\n' +
      'ChallengeResponseAuthentication no\n' +
      'PubkeyAuthentication yes\n' +
      'PermitRootLogin no\n' +
      'UsePAM no\n' +
      'PrintMotd no\n' +
      'LogLevel VERBOSE\n' +
      'StrictModes no\n' +
      'AllowUsers simon\n',
  )
  expect(writtenFiles.get(sshConfigPath)).toEqual(
    'Host local-test\n' +
      '    HostName 127.0.0.1\n' +
      '    User simon\n' +
      '    Port 2222\n' +
      '    IdentityFile /repo/.vscode-user-data-dir/remote-ssh/id_ed25519\n' +
      '    IdentitiesOnly yes\n' +
      '    BatchMode yes\n' +
      '    ConnectTimeout 5\n' +
      '    StrictHostKeyChecking no\n' +
      '    UserKnownHostsFile /repo/.vscode-user-data-dir/remote-ssh/known_hosts\n' +
      '    LogLevel ERROR\n',
  )
  expect(writtenFiles.get(settingsPath)).toEqual(
    '{\n' +
      '  "window.titleBarStyle": "custom",\n' +
      '  "remote.SSH.configFile": "/repo/.vscode-user-data-dir/remote-ssh/config",\n' +
      '  "remote.SSH.useLocalServer": false,\n' +
      '  "remote.SSH.useExecServer": false,\n' +
      '  "remote.SSH.showLoginTerminal": true\n' +
      '}\n',
  )
})

test('launch fails with a helpful error on unsupported platforms', async () => {
  const sshServer = createWithDependencies(
    {
      page: {},
      VError: createMockVError,
    },
    {
      ensureDirectory: async () => {},
      findExecutable: async () => '/usr/bin/sshd',
      getAvailablePort: async () => 2222,
      getPlatform: () => 'win32',
      getRootDir: () => '/repo',
      getUserName: () => 'simon',
      isPortOpen: async () => false,
      readTextFile: async () => '',
      removeDirectory: async () => {},
      runProcess: async () => ({ exitCode: 0, stderr: '', stdout: '' }),
      sleep: async () => {},
      spawnProcess: (() => new MockChildProcess() as any) as any,
      writeTextFile: async () => {},
    },
  )

  await expect(sshServer.launch()).rejects.toThrow(
    'Failed to launch SSH server: Remote - SSH test server requires Linux and a real sshd installation. Current platform: win32. code-server.sh is not a valid Remote - SSH target.',
  )
})

test('launch fails with a helpful error when sshd is missing', async () => {
  const sshServer = createWithDependencies(
    {
      page: {},
      VError: createMockVError,
    },
    {
      ensureDirectory: async () => {},
      findExecutable: async (name: string) => {
        if (name === 'sshd') {
          return undefined
        }
        return `/usr/bin/${name}`
      },
      getAvailablePort: async () => 2222,
      getPlatform: () => 'linux',
      getRootDir: () => '/repo',
      getUserName: () => 'simon',
      isPortOpen: async () => false,
      readTextFile: async () => '',
      removeDirectory: async () => {},
      runProcess: async () => ({ exitCode: 0, stderr: '', stdout: '' }),
      sleep: async () => {},
      spawnProcess: (() => new MockChildProcess() as any) as any,
      writeTextFile: async () => {},
    },
  )

  await expect(sshServer.launch()).rejects.toThrow(
    'Failed to launch SSH server: OpenSSH binary "sshd" was not found in PATH. Install the Linux OpenSSH server to run a real Remote - SSH repro. On Ubuntu: sudo apt update && sudo apt install openssh-server',
  )
})
