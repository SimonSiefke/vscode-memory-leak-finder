export const create = ({ expect, page, VError }) => {
  return {
    async toHaveResults(results) {
      try {
        const searchView = page.locator(".search-view");
        const searchResults = searchView.locator(".monaco-list-row");
        await expect(searchResults).toHaveCount(results.length);
        for (let i = 0; i < results.length; i++) {
          const searchResult = searchResults.nth(i);
          await expect(searchResult).toHaveText(results[i]);
        }
      } catch (error) {
        throw new VError(error, `Failed to assert search results`);
      }
    },
    async type(text) {
      try {
        const searchView = page.locator(".search-view");
        const searchInput = searchView.locator('textarea[title="Search"]');
        await expect(searchInput).toBeFocused();
        await searchInput.type(text);
      } catch (error) {
        throw new VError(error, `Failed to type into search input`);
      }
    },
    async deleteText() {
      try {
        const searchView = page.locator(".search-view");
        const searchInput = searchView.locator('textarea[title="Search"]');
        await expect(searchInput).toBeFocused();
        await searchInput.selectText();
        await searchInput.press("Backspace");
        await expect(searchInput).toHaveText("");
      } catch (error) {
        throw new VError(error, `Failed to delete search input text`);
      }
    },
  };
};
