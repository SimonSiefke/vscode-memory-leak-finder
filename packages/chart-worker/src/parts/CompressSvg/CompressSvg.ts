import { optimize } from 'svgo'

export const compressSvg = async (svg: string): Promise<string> => {
  const result = optimize(svg, {
    multipass: true,
  })
  if (result.data) {
    return result.data
  }
  return svg
}
