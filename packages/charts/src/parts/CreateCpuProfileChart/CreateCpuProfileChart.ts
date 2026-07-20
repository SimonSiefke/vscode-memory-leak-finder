import * as GetCpuProfileData from '../GetCpuProfileData/GetCpuProfileData.ts'

export const name = 'cpu-profile'

export const getData = (
  basePath: string,
): Promise<readonly { readonly data: readonly GetCpuProfileData.CpuProfileFrame[]; readonly filename: string }[]> => {
  return GetCpuProfileData.getCpuProfileData(basePath)
}

export const createChart = (): {
  readonly headerHeight: number
  readonly rowHeight: number
  readonly type: string
  readonly width: number
} => {
  return {
    headerHeight: 72,
    rowHeight: 18,
    type: 'cpu-profile-flame-chart',
    width: 1400,
  }
}

export const multiple = true
