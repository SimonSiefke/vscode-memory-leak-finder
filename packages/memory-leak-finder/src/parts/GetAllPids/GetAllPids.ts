import type { Dynamic } from '../Types/Types.ts'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
const execAsync = promisify(exec)
const getChildPids = async (pid: number): Promise<readonly number[]> => {
  try {
    const { stdout } = await execAsync(`pgrep -P ${pid}`)
    const childPids = stdout
      .trim()
      .split('\n')
      .filter((line: Dynamic) => line.trim())
      .map((line: Dynamic) => Number.parseInt(line.trim(), 10))
      .filter((pid: Dynamic) => !Number.isNaN(pid))
    return childPids
  } catch {
    return []
  }
}
export const getAllDescendantPids = async (pid: number): Promise<readonly number[]> => {
  const allPids: number[] = [pid]
  const childPids = await getChildPids(pid)
  for (const childPid of childPids) {
    const descendants = await getAllDescendantPids(childPid)
    allPids.push(...descendants)
  }
  return allPids
}
