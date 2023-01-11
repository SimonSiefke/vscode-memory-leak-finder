export const run = async ({ page, expect }) => {
  const html = await page.evaluate(() => {
    // @ts-ignore
    return document.body.innerHTML;
  });
  expect(html).toContain(`<!-- Startup via workbench.js -->`);
};
