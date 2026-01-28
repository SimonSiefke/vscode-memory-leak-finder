import { execSync } from 'node:child_process'

const getProcessNameFromPs = (pid: number): string => {
  try {
    const stdout = execSync(`ps -p ${pid} -o comm=`).toString()
    return stdout.trim() || 'unknown'
  } catch {
    return 'unknown'
  }
}

export { getProcessNameFromPs }
