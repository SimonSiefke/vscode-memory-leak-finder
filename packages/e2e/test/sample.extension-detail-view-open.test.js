import { createRunner } from "./_run.js";

let runner;

beforeAll(() => {
  runner = createRunner("sample.extension-detail-view-open");
});

afterAll(async () => {
  await runner.kill();
});

test("sample.extension-detail-view-open", async () => {
  await runner.waitForSucceeded();
  expect(runner.stdout).toContainEqual(
    expect.stringContaining(`event listener increase:`)
  );
});
