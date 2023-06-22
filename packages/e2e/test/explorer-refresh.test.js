import { createRunner } from "./_run.js";

let runner;

beforeAll(() => {
  runner = createRunner("explorer-refresh");
});

afterAll(async () => {
  await runner.kill();
});

test("explorer-refresh", async () => {
  await runner.waitForSucceeded();
  expect(runner.stdout).toContainEqual(
    expect.stringContaining(`event listener increase:`)
  );
});
