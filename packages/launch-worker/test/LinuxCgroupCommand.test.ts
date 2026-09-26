import { expect, test } from '@jest/globals'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as Command from '../src/parts/LinuxCgroupCommand/LinuxCgroupCommand.ts'

const linuxTest = process.platform === 'linux' ? test : test.skip

linuxTest('joins before exec and preserves literal command arguments', async () => {
  const path = await mkdtemp(join(tmpdir(), 'cgroup with spaces-'))
  try {
    await writeFile(join(path, 'memory.current'), '0')
    await writeFile(join(path, 'cgroup.events'), 'populated 0\n')
    await writeFile(join(path, 'cgroup.procs'), '')
    const arg = '$(false); literal argument'
    const command = await Command.wrap(
      process.execPath,
      ['-e', 'process.stdout.write(`${process.pid} ${process.argv[1]}`)', arg],
      path,
      'linux',
    )
    const result = await promisify(execFile)(command.command, command.args, { env: { ...process.env, FORCE_COLOR: '1' } })
    const pid = (await readFile(join(path, 'cgroup.procs'), 'utf8')).trim()
    expect(result.stdout.trim()).toBe(`${pid} ${arg}`)
    await expect(Command.wrap('code', [], path, 'linux')).rejects.toThrow('empty')
    await writeFile(join(path, 'cgroup.procs'), '')
    await writeFile(join(path, 'cgroup.events'), 'populated 1\n')
    await expect(Command.wrap('code', [], path, 'linux')).rejects.toThrow('empty')
    await expect(Command.wrap('code', [], path, 'win32')).rejects.toThrow('Linux')
  } finally {
    await rm(path, { force: true, recursive: true })
  }
})
