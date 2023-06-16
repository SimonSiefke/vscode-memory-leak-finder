export const create = ({ expect, page, VError }) => {
  return {
    async shouldHaveCount(count) {
      try {
        const problemsBadge = page.locator(
          '[role="tab"] [aria-label^="Problems"] + .badge'
        );
        const badgeContent = problemsBadge.locator(".badge-content");
        if (count === 0) {
          await expect(problemsBadge).toBeHidden();
        } else {
          await expect(problemsBadge).toBeVisible();
          await expect(badgeContent).toHaveText(`${count}`);
        }
      } catch (error) {
        throw new VError(error, `Failed to assert problems count of ${count}`);
      }
    },
  };
};
