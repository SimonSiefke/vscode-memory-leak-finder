import { join } from 'node:path'
import childProcess from 'node:child_process'
import { readFile } from 'node:fs/promises'
import util from 'node:util'
import VError from 'verror'
import * as Assert from '../Assert/Assert.js'
import * as ListProcessGetName from '../ListProcessGetName/ListProcessGetName.js'
import * as ErrorCodes from '../ErrorCodes/ErrorCodes.js'

const execFile = util.promisify(childProcess.execFile)

// parse ps output based on vscode https://github.com/microsoft/vscode/blob/c0769274fa136b45799edeccc0d0a2f645b75caf/src/vs/base/node/ps.ts (License MIT)

const PID_CMD = /^\s*(\d+)\s+(\d+)\s+([\d.]+)\s+([\d.]+)\s+(.+)$/s

const parsePsOutputLine = (line) => {
  Assert.string(line)
  const matches = PID_CMD.exec(line.trim())
  if (matches && matches.length === 6) {
    return {
      pid: Number.parseInt(matches[1]),
      ppid: Number.parseInt(matches[2]),
      cmd: matches[5],
      // load: parseInt(matches[3]),
      // mem: parseInt(matches[4]),
    }
  }
  throw new Error(`line could not be parsed: ${line}`)
}

const parsePsOutput = (stdout, rootPid) => {
  Assert.string(stdout)
  Assert.number(rootPid)
  const lines = stdout.split('\n')
  const result = []
  const depthMap = Object.create(null)
  depthMap[rootPid] = 1
  const parsedLines = lines.map(parsePsOutputLine)
  for (const parsedLine of parsedLines) {
    const depth = parsedLine.pid === rootPid ? 1 : depthMap[parsedLine.ppid]
    if (!depth) {
      continue
    }
    result.push({
      ...parsedLine,
      depth,
      name: ListProcessGetName.getName(parsedLine.pid, parsedLine.cmd, rootPid),
    })
    depthMap[parsedLine.pid] = depth + 1
  }
  return result
}

const getAccurateMemoryUsage = async (pid) => {
  Assert.number(pid)
  try {
    const filePath = join('/proc', `${pid}`, 'statm')
    let content
    try {
      content = await readFile(filePath, 'utf-8')
    } catch (error) {
      if (
        error &&
        // @ts-ignore
        (error.code === ErrorCodes.ENOENT ||
          // @ts-ignore
          error.code === ErrorCodes.ESRCH)
      ) {
        return -1
      }
      throw error
    }
    const trimmedContent = content.trim()
    const numberBlocks = trimmedContent.split(' ')
    const pageSize = 4096
    const rss = Number.parseInt(numberBlocks[1]) * pageSize
    const shared = Number.parseInt(numberBlocks[2]) * pageSize
    const memory = rss - shared
    return memory
  } catch (error) {
    // @ts-ignore
    throw new VError(error, 'Failed to get accurate memory usage')
  }
}

const getPsOutput = async () => {
  try {
    const { stdout } = await execFile('ps', ['-ax', '-o', 'pid=,ppid=,pcpu=,pmem=,command='])
    return stdout.trim()
  } catch (error) {
    // @ts-ignore
    throw new VError(error, `Failed to execute ps`)
  }
}

const addAccurateMemoryUsage = async (process) => {
  const accurateMemoryUsage = await getAccurateMemoryUsage(process.pid)
  return {
    ...process,
    memory: accurateMemoryUsage,
  }
}

const hasPositiveMemoryUsage = (process) => {
  return process.memory >= 0
}

/**
 *
 * @param {number} rootPid
 * @returns
 */
export const listProcessesWithMemoryUsage = async (rootPid) => {
  // console.time('getPsOutput')
  const stdout = await getPsOutput()
  // console.log({ stdout })
  // console.timeEnd('getPsOutput')
  // console.time('parsePsOutput')
  const parsed = parsePsOutput(stdout, rootPid)
  // console.timeEnd('parsePsOutput')
  // console.time('addAccurateMemoryUsage')
  const parsedWithAccurateMemoryUsage = await Promise.all(parsed.map(addAccurateMemoryUsage))
  // console.timeEnd('addAccurateMemoryUsage')
  const filtered = parsedWithAccurateMemoryUsage.filter(hasPositiveMemoryUsage)
  return filtered
}
