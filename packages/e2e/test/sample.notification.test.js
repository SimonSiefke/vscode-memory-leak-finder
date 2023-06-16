import { createRunner } from "./_run.js";

let runner;

beforeAll(() => {
  runner = createRunner("sample.notification");
});

afterAll(async () => {
  await runner.kill();
});

test("sample.notification", async () => {
  await runner.waitForSucceeded();
  expect(runner.stdout).toContainEqual(
    expect.stringContaining(`event listener equal:`)
  );
});
