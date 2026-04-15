export const delay = async (timeout: number): Promise<void> => {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, timeout)
  })
}
