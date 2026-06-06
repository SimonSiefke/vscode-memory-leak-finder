export const write = async (message: string): Promise<void> => {
  process.stdout.write(message)
}
