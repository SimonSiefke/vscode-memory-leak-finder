await import('dotenv/config')

const Main = await import('./parts/Main/Main.ts')

await Main.main()
