const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

describe('Mocha bulk suite', function () {
  let config

  before(function () {
    config = JSON.parse(fs.readFileSync(path.join(__dirname, '../.mocha-run.json'), 'utf8'))
  })

  for (let i = 0; i < 5000; i++) {
    it(`case ${String(i).padStart(4, '0')}`, function () {
      if (config.mixed && i % 1000 === 1) this.skip()
      if (i % 100 === 0) console.log(`MOCHA_PROGRESS ${config.token} ${i}`)
      assert.ok(!config.mixed || i % 1000 !== 0, `Intentional failure ${i}`)
    })
  }

  after(function () {
    const tests = this.test.parent.tests
    const report = {
      token: config.token,
      passed: tests.filter((test) => test.state === 'passed').length,
      failed: tests.filter((test) => test.state === 'failed').length,
      skipped: tests.filter((test) => test.pending).length,
      finishedAt: Date.now(),
    }
    console.log(`MOCHA_COMPLETE ${config.token}`)
    // Atomic publication prevents the driver from reading a partial JSON file.
    const temporary = path.join(__dirname, '../.mocha-complete.tmp')
    fs.writeFileSync(temporary, JSON.stringify(report))
    fs.renameSync(temporary, path.join(__dirname, '../.mocha-complete.json'))
  })
})
