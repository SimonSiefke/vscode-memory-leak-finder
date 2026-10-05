import { getCompiledCodeSizeByFileData } from '../GetCompiledCodeSizeData/GetCompiledCodeSizeData.ts'

export const name = 'compiled-code-size-by-file'

export const getData = (basePath: string): Promise<any[]> => getCompiledCodeSizeByFileData(basePath)

export const createChart = () => {
  return {
    fontSize: 12,
    marginLeft: 620,
    marginRight: 190,
    title: 'Compiled code by source file',
    type: 'compiled-code-size-chart',
    width: 1700,
  }
}

export const multiple = true
