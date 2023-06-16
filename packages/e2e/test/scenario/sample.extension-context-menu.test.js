import { createRunner } from "./_run.js";

let runner;

beforeAll(() => {
  runner = createRunner("sample.extension-context-menu");
});

afterAll(async () => {
  await runner.kill();
});

test("sample.extension-context-menu", async () => {
  await runner.waitForSucceeded();
  expect(runner.stdout).toContainEqual(
    expect.stringContaining(`event listener equal:`)
  );
});
