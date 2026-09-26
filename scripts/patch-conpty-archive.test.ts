import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { createPackageWithOptions, extractFile, statFile } from '../.tmp/asar-tools/node_modules/@electron/asar/lib/asar.js'
import { agentPath, patchConptyArchive } from './patch-conpty-archive.ts'

const agent = `module.exports = function () {
            var _this = this;
            this._outSocket.on('data', function () {
                _this._conoutSocketWorker.dispose();
            });
};`

test('patches a loadable archive while preserving packed dependencies and unpacked native files', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'conpty-archive-'))
  try {
    const source = join(directory, 'source')
    await mkdir(join(source, 'node-pty/lib'), { recursive: true })
    await mkdir(join(source, 'node-pty/build'), { recursive: true })
    await writeFile(join(source, agentPath), agent)
    await writeFile(join(source, 'node-pty/package.json'), '{"main":"lib/windowsPtyAgent.js"}')
    const native = Buffer.from([0, 1, 2, 255])
    await writeFile(join(source, 'node-pty/build/conpty.node'), native)
    const baseline = join(directory, 'baseline.asar')
    const candidate = join(directory, 'candidate.asar')
    await createPackageWithOptions(source, baseline, { unpack: '**/*.node' })
    const result = await patchConptyArchive(baseline, candidate)
    assert.equal(result.verifiedFiles, 3)
    assert.equal(extractFile(baseline, agentPath).toString(), agent)
    const load = (code: string) => {
      const module = { exports: undefined as any }
      new Function('module', code)(module)
      return module.exports
    }
    let disposals = 0
    const receiver = { _outSocket: { on() {} }, _conoutSocketWorker: { dispose: () => disposals++ } }
    load(agent).call(receiver)
    assert.equal(disposals, 0)
    load(extractFile(candidate, agentPath).toString()).call(receiver)
    assert.equal(disposals, 1)
    assert.equal(statFile(candidate, join('node-pty', 'build', 'conpty.node')).unpacked, true)
    assert.deepEqual(await readFile(`${candidate}.unpacked/node-pty/build/conpty.node`), native)
    assert.deepEqual(extractFile(candidate, join('node-pty', 'package.json')), extractFile(baseline, join('node-pty', 'package.json')))
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('rejects a product whose cleanup code does not match', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'conpty-archive-'))
  try {
    const source = join(directory, 'source')
    await mkdir(join(source, 'node-pty/lib'), { recursive: true })
    await writeFile(join(source, agentPath), '// different implementation')
    const baseline = join(directory, 'baseline.asar')
    await createPackageWithOptions(source, baseline, {})
    await assert.rejects(patchConptyArchive(baseline, join(directory, 'candidate.asar')), /Unexpected bundled node-pty implementation/)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
