import { expect, test } from '@jest/globals'
import * as PerfStat from '../src/parts/PerfStat/PerfStat.ts'

test('attaches to every current process and keeps inheritance enabled', () => {
  const args = PerfStat.getPerfStatArgs([10, 20])
  expect(args).toEqual([
    'stat',
    '--no-big-num',
    '-x',
    ',',
    '-e',
    'duration_time,user_time,system_time,task-clock,instructions:u,cycles:u,context-switches,cpu-migrations,page-faults,minor-faults,major-faults',
    '-p',
    '10,20',
  ])
  expect(args).not.toContain('--no-inherit')
})
