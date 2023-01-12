import * as ActivityBar from "./parts/ActivityBar/ActivityBar.js";
import * as Editor from "./parts/Editor/Editor.js";
import * as Explorer from "./parts/Explorer/Explorer.js";
import * as Panel from "./parts/Panel/Panel.js";
import * as Suggest from "./parts/Suggest/Suggest.js";
import * as TitleBar from "./parts/TitleBar/TitleBar.js";

export const create = ({ page, expect, VError }) => {
  return {
    ActivityBar: ActivityBar.create({ page, expect, VError }),
    Editor: Editor.create({ page, expect, VError }),
    Explorer: Explorer.create({ page, expect, VError }),
    Panel: Panel.create({ page, expect, VError }),
    Suggest: Suggest.create({ page, expect, VError }),
    TitleBar: TitleBar.create({ page, expect, VError }),
  };
};
