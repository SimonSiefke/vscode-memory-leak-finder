import { createRunner } from "./_run.js";

let runner;

beforeAll(() => {
  runner = createRunner("editor-type");
});

afterAll(async () => {
  await runner.kill();
});

test("editor-type", async () => {
  await runner.waitForSucceeded();
  expect(runner.stdout).toContainEqual(
    expect.stringContaining(`event listener equal:`)
  );
});
