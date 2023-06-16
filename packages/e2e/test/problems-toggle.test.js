import { createRunner } from "./_run.js";

let runner;

beforeAll(() => {
  runner = createRunner("problems-toggle");
});

afterAll(async () => {
  await runner.kill();
});

test("problems-toggle", async () => {
  await runner.waitForSucceeded();
  expect(runner.stdout).toContainEqual(
    expect.stringContaining(`event listener equal:`)
  );
});
