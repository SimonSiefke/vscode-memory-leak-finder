import { createRunner } from "./_run.js";

let runner;

beforeAll(() => {
  runner = createRunner("sample.status-bar-item");
});

afterAll(async () => {
  await runner.kill();
});

test("sample.status-bar-item", async () => {
  await runner.waitForSucceeded();
  expect(runner.stdout).toContainEqual(
    expect.stringContaining(`event listener equal:`)
  );
});
