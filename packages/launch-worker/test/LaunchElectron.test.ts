import { beforeEach, expect, jest, test } from '@jest/globals'
import EventEmitter from 'node:events'

const mockDisposeLinuxProcessTreeWorker = jest.fn()
const mockStartLinuxProcessTreeWorker = jest.fn<(pid: number, options: unknown) => Promise<unknown>>()

beforeEach(() => {
  jest.resetAllMocks()
})

jest.unstable_mockModule('../src/parts/Spawn/Spawn.ts', () => {
  return {
    spawn: jest.fn(() => {
      throw new Error('not implemented')
    }),
  }
})

jest.unstable_mockModule('../src/parts/AssertCallgrindAvailable/AssertCallgrindAvailable.ts', () => {
  return {
    assertCallgrindAvailable: jest.fn(),
  }
})

jest.unstable_mockModule('@vscode-memory-leak-finder/linux-process-tree-worker', () => {
  return {
    dispose: mockDisposeLinuxProcessTreeWorker,
    start: mockStartLinuxProcessTreeWorker,
  }
})

const LaunchElectron = await import('../src/parts/LaunchElectron/LaunchElectron.ts')
const AssertCallgrindAvailable = await import('../src/parts/AssertCallgrindAvailable/AssertCallgrindAvailable.ts')
const Spawn = await import('../src/parts/Spawn/Spawn.ts')

const createChild = (pid = 123) => {
  const stdout = new EventEmitter()
  // @ts-ignore
  stdout.setEncoding = () => {}
  const stderr = new EventEmitter()
  // @ts-ignore
  stderr.setEncoding = () => {}
  return {
    pid,
    stderr,
    stdout,
    kill: jest.fn(),
  }
}

test('launch - normal spawn command', async () => {
  const child = createChild()
  // @ts-ignore
  Spawn.spawn.mockImplementation(() => child)
  await LaunchElectron.launchElectron({
    addDisposable() {},
    args: ['--user-data-dir', '/tmp/user-data'],
    cliPath: '/usr/bin/code',
    cwd: '/tmp',
    env: {},
    headlessMode: false,
  })
  expect(Spawn.spawn).toHaveBeenCalledWith(
    '/usr/bin/code',
    ['--inspect-brk=0', '--remote-debugging-port=0', '--user-data-dir', '/tmp/user-data'],
    {
      cwd: '/tmp',
      env: {},
    },
  )
})

test('launch - callgrind spawn command', async () => {
  const child = createChild()
  // @ts-ignore
  Spawn.spawn.mockImplementation(() => child)
  await LaunchElectron.launchElectron({
    addDisposable() {},
    args: ['--user-data-dir', '/tmp/user-data'],
    callgrindConfig: {
      enabled: true,
      spoolDir: '/tmp/vmlf-callgrind-test',
      vgdbPrefix: 'vmlf-callgrind-test',
    },
    cliPath: '/usr/bin/code',
    cwd: '/tmp',
    env: {},
    headlessMode: false,
    platform: 'linux',
  })
  expect(AssertCallgrindAvailable.assertCallgrindAvailable).toHaveBeenCalledWith('linux')
  expect(Spawn.spawn).toHaveBeenCalledWith(
    'valgrind',
    [
      '--tool=callgrind',
      '--trace-children=yes',
      '--instr-atstart=no',
      '--callgrind-out-file=/tmp/vmlf-callgrind-test/callgrind.out.%p',
      '--vgdb-prefix=vmlf-callgrind-test',
      '--log-file=/tmp/vmlf-callgrind-test/valgrind.%p.log',
      '/usr/bin/code',
      '--inspect-brk=0',
      '--remote-debugging-port=0',
      '--user-data-dir',
      '/tmp/user-data',
    ],
    {
      cwd: '/tmp',
      env: {},
    },
  )
})

test('launch - cpu performance counters from start spawn command', async () => {
  const child = createChild()
  // @ts-ignore
  Spawn.spawn.mockImplementation(() => child)
  await LaunchElectron.launchElectron({
    addDisposable() {},
    args: ['--user-data-dir', '/tmp/user-data'],
    cliPath: '/usr/bin/code',
    cpuPerformanceCountersFromStartConfig: {
      enabled: true,
      metadataPath: '/tmp/vmlf-perf-stat.json',
      outputPath: '/tmp/vmlf-perf-stat.txt',
    },
    cwd: '/tmp',
    env: {},
    headlessMode: false,
    platform: 'linux',
  })
  expect(Spawn.spawn).toHaveBeenCalledWith(
    'perf',
    [
      'stat',
      '--no-big-num',
      '-x',
      ',',
      '-I',
      '100',
      '-e',
      'instructions:u,cycles:u',
      '-o',
      '/tmp/vmlf-perf-stat.txt',
      '--',
      '/usr/bin/code',
      '--inspect-brk=0',
      '--remote-debugging-port=0',
      '--user-data-dir',
      '/tmp/user-data',
    ],
    {
      cwd: '/tmp',
      env: {},
    },
  )
})

test('launch - Linux process-tree resources from start wraps Electron and starts the measurement worker', async () => {
  const perfChild = createChild(123)
  const disposables: Array<() => Promise<void> | void> = []
  const measurement = {
    outputDirectory: '/tmp/vmlf-linux-process-tree-worker',
    resultPath: '/tmp/vmlf-linux-process-tree-worker/result.json',
    workerPid: 456,
    workerStartTimeTicks: '789',
  }
  // @ts-ignore
  Spawn.spawn.mockImplementationOnce(() => perfChild)
  mockStartLinuxProcessTreeWorker.mockResolvedValue(measurement)
  await LaunchElectron.launchElectron({
    addDisposable(disposable) {
      disposables.push(disposable)
    },
    args: ['--user-data-dir', '/tmp/user-data'],
    cliPath: '/usr/bin/code',
    cwd: '/tmp',
    env: {},
    headlessMode: false,
    linuxProcessTreeResourcesFromStartConfig: {
      enabled: true,
      metadataPath: '/tmp/vmlf-linux-resources.json',
      perfOutputPath: '/tmp/vmlf-linux-resources.perf.txt',
    },
    platform: 'linux',
  })
  expect(Spawn.spawn).toHaveBeenNthCalledWith(
    1,
    'perf',
    [
      'stat',
      '--no-big-num',
      '-x',
      ',',
      '-I',
      '100',
      '-e',
      'duration_time,user_time,system_time,task-clock,instructions:u,cycles:u,context-switches,cpu-migrations,page-faults,minor-faults,major-faults',
      '-o',
      '/tmp/vmlf-linux-resources.perf.txt',
      '--',
      '/usr/bin/code',
      '--inspect-brk=0',
      '--remote-debugging-port=0',
      '--user-data-dir',
      '/tmp/user-data',
    ],
    { cwd: '/tmp', env: {} },
  )
  expect(mockStartLinuxProcessTreeWorker).toHaveBeenCalledWith(123, {
    perfOutputPath: '/tmp/vmlf-linux-resources.perf.txt',
    window: 'fromStart',
  })
  expect(Spawn.spawn).toHaveBeenCalledTimes(1)
  await disposables[1]()
  expect(mockDisposeLinuxProcessTreeWorker).toHaveBeenCalledWith(measurement)
})

test('launch - Linux process-tree resources from start rejects other platforms', async () => {
  await expect(
    LaunchElectron.launchElectron({
      addDisposable() {},
      args: [],
      cliPath: '/usr/bin/code',
      cwd: '/tmp',
      env: {},
      headlessMode: false,
      linuxProcessTreeResourcesFromStartConfig: {
        enabled: true,
        metadataPath: '/tmp/vmlf-linux-resources.json',
        perfOutputPath: '/tmp/vmlf-linux-resources.perf.txt',
      },
      platform: 'darwin',
    }),
  ).rejects.toThrow('linux-process-tree-resources-from-start is only supported on Linux')
  expect(Spawn.spawn).not.toHaveBeenCalled()
})

test.skip('launch - error - address already in use', async () => {
  // @ts-ignore
  Spawn.spawn.mockImplementation(() => {
    const stdout = new EventEmitter()
    // @ts-ignore
    stdout.setEncoding = () => {}
    const stderr = new EventEmitter()
    // @ts-ignore
    stderr.setEncoding = () => {}

    setTimeout(() => {
      stderr.emit('data', `Starting inspector on 127.0.0.1:4444 failed: address already in use`)
    }, 0)
    return {
      stderr,
      stdout,
    }
  })
  // TODO mock WaitForDebuggerlistening module instead of mocking spawn
  await expect(
    LaunchElectron.launchElectron({ addDisposable() {}, args: [], cliPath: '', cwd: '', env: {}, headlessMode: true }),
  ).rejects.toThrow(new Error(`Failed to launch electron: Starting inspector on 127.0.0.1:4444 failed: address already in use`))
})

test.skip('launch - error - unexpected first message', async () => {
  // @ts-ignore
  Spawn.spawn.mockImplementation(() => {
    const stdout = new EventEmitter()
    // @ts-ignore
    stdout.setEncoding = () => {}
    const stderr = new EventEmitter()
    // @ts-ignore
    stderr.setEncoding = () => {}

    setTimeout(() => {
      stderr.emit('data', `abc`)
    }, 0)
    return {
      stderr,
      stdout,
    }
  })
  await expect(
    LaunchElectron.launchElectron({ addDisposable() {}, args: [], cliPath: '', cwd: '', env: {}, headlessMode: true }),
  ).rejects.toThrow(new Error('Failed to launch electron: Failed to connect to debugger: Unexpected first message: abc'))
})

test('launch - error - empty cli path', async () => {
  // @ts-ignore
  Spawn.spawn.mockImplementation(() => {
    throw new Error("The argument 'file' cannot be empty. Received ''")
  })
  await expect(
    LaunchElectron.launchElectron({ addDisposable() {}, args: [], cliPath: '', cwd: '', env: {}, headlessMode: true }),
  ).rejects.toThrow(new Error(`Failed to launch electron: The argument 'file' cannot be empty. Received ''`))
})

test.skip('launch - error - yarn is not installed', async () => {
  // @ts-ignore
  Spawn.spawn.mockImplementation(() => {
    const stdout = new EventEmitter()
    // @ts-ignore
    stdout.setEncoding = () => {}
    const stderr = new EventEmitter()
    // @ts-ignore
    stderr.setEncoding = () => {}

    setTimeout(() => {
      stderr.emit(
        'data',
        `Error: spawn yarn ENOENT
    at ChildProcess._handle.onexit (node:internal/child_process:284:19)
    at onErrorNT (node:internal/child_process:477:16)
    at process.processTicksAndRejections (node:internal/process/task_queues:82:21) {
  errno: -2,
  code: 'ENOENT',
  syscall: 'spawn yarn',
  path: 'yarn',
  spawnargs: [ 'electron' ]
}`,
      )
    }, 0)
    return {
      stderr,
      stdout,
    }
  })
  await expect(
    LaunchElectron.launchElectron({ addDisposable() {}, args: [], cliPath: '', cwd: '', env: {}, headlessMode: true }),
  ).rejects.toThrow(new Error(`Failed to launch electron: yarn not installed in this node version (test-node-version)`))
})
