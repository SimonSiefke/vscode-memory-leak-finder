import { createRunner } from "./_run.js";

let runner;

beforeAll(() => {
  runner = createRunner("sample.toggle-zen-mode");
});

afterAll(async () => {
  await runner.kill();
});

test("sample.toggle-zen-mode", async () => {
  await runner.waitForSucceeded();
  expect(runner.stdout).toContainEqual(
    expect.stringContaining(`event listener equal:`)
  );
});
